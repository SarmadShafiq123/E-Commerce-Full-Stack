import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * protect — verifies access token from httpOnly cookie.
 * Role is always re-fetched from DB so stale JWT claims can't be exploited.
 * Returns 401 with { code: 'TOKEN_EXPIRED' } so the frontend knows to refresh.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Always load from DB — never trust role from JWT alone
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired',
      });
      return;
    }
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

/**
 * isAdmin — must be used after protect.
 * Double-checks role from req.user (which was loaded from DB in protect).
 */
export const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403);
  throw new Error('Access denied. Admin only.');
};

/**
 * optionalAuth — attaches user to req if a valid token is present,
 * but does NOT block the request if there is no token.
 * Useful for public routes that behave differently for logged-in users.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (_) {
    // Silently ignore — request continues unauthenticated
  }
  next();
});
