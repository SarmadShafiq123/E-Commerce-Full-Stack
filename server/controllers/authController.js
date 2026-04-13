import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/User.js';
import {
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
} from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import { verifyEmailTemplate } from '../utils/emailTemplates.js';
import audit from '../utils/auditLogger.js';

// ── Cookie helpers ────────────────────────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 min
};

const REFRESH_COOKIE = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth', // scope refresh cookie to auth routes only
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('token', accessToken, ACCESS_COOKIE);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE);
};

const clearAuthCookies = (res) => {
  res.cookie('token', '', { ...ACCESS_COOKIE, maxAge: 0 });
  res.cookie('refreshToken', '', { ...REFRESH_COOKIE, maxAge: 0 });
};

const getMeta = (req) => ({
  ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
  userAgent: req.headers['user-agent'] || '',
});

// ── Shared user payload ───────────────────────────────────────────────────────

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ── Controllers ───────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password });

  const verifyToken = crypto.randomBytes(32).toString('hex');
  user.emailVerifyToken = verifyToken;
  user.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verifyToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your email — Luxe Bags',
    html: verifyEmailTemplate(verifyUrl),
  });

  audit({ action: 'AUTH_REGISTER', user, req, metadata: { email } });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const meta = getMeta(req);

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    audit({
      action: 'AUTH_LOGIN',
      req,
      metadata: { email },
      success: false,
      errorMessage: 'Invalid credentials',
    });
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.emailVerified) {
    res.status(401);
    throw new Error('Please verify your email before logging in. Check your inbox.');
  }

  const accessToken  = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user._id, null, meta);
  setAuthCookies(res, accessToken, refreshToken);

  audit({
    action: user.role === 'admin' ? 'ADMIN_LOGIN' : 'AUTH_LOGIN',
    user,
    req,
    metadata: { email },
  });

  res.json({
    success: true,
    data: userPayload(user),
    message: 'Login successful',
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const incomingRefresh = req.cookies?.refreshToken;

  if (!incomingRefresh) {
    res.status(401);
    throw new Error('No refresh token');
  }

  let result;
  try {
    result = await rotateRefreshToken(incomingRefresh, getMeta(req));
  } catch (err) {
    // Reuse detected — log it
    if (err.code === 'TOKEN_REUSE') {
      audit({
        action: 'AUTH_TOKEN_REUSE_DETECTED',
        req,
        metadata: { token: incomingRefresh.slice(0, 8) + '…' },
        success: false,
        errorMessage: err.message,
      });
    }
    clearAuthCookies(res);
    res.status(err.status || 401);
    throw new Error(err.message);
  }

  const { newRefreshToken, user } = result;

  // Re-fetch user from DB to get latest role (never trust stale JWT claims)
  const freshUser = await User.findById(user._id).select('-password');
  if (!freshUser) {
    clearAuthCookies(res);
    res.status(401);
    throw new Error('User not found');
  }

  const newAccessToken = generateAccessToken(freshUser);
  setAuthCookies(res, newAccessToken, newRefreshToken);

  audit({ action: 'AUTH_REFRESH', user: freshUser, req });

  res.json({
    success: true,
    data: userPayload(freshUser),
    message: 'Token refreshed',
  });
});

export const logout = asyncHandler(async (req, res) => {
  const incomingRefresh = req.cookies?.refreshToken;

  // Revoke the specific refresh token if present
  if (incomingRefresh) {
    const { default: RefreshToken } = await import('../models/RefreshToken.js');
    await RefreshToken.findOneAndUpdate(
      { token: incomingRefresh },
      { revoked: true }
    ).catch(() => {});
  }

  if (req.user) {
    audit({ action: 'AUTH_LOGOUT', user: req.user, req });
  }

  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }
  await revokeAllUserTokens(req.user._id);
  clearAuthCookies(res);
  audit({ action: 'AUTH_LOGOUT', user: req.user, req, metadata: { allDevices: true } });
  res.json({ success: true, message: 'Logged out from all devices' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const meta = getMeta(req);

  const user = await User.findOne({
    emailVerifyToken: token,
    emailVerifyExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(200).json({
      success: true,
      alreadyVerified: true,
      message: 'Email already verified. Redirecting...',
    });
    return;
  }

  user.emailVerified = true;
  user.emailVerifyToken = null;
  user.emailVerifyExpires = null;
  await user.save();

  const accessToken  = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user._id, null, meta);
  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    alreadyVerified: false,
    message: 'Email verified successfully.',
    data: userPayload(user),
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide email address');
  }

  const user = await User.findOne({ email });
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.emailVerified) { res.status(400); throw new Error('Email is already verified'); }

  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerifyToken = token;
  user.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your email — Luxe Bags',
    html: verifyEmailTemplate(verifyUrl),
  });

  res.status(200).json({ success: true, message: 'Verification email sent successfully' });
});

export const googleAuth = (req, res, next) => {
  const passport = req.app.get('passport');
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

export const googleCallback = (req, res, next) => {
  const passport = req.app.get('passport');
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    const meta = getMeta(req);
    const accessToken  = generateAccessToken(user);
    const refreshToken = await createRefreshToken(user._id, null, meta);
    setAuthCookies(res, accessToken, refreshToken);

    audit({ action: 'AUTH_GOOGLE_LOGIN', user, req });

    res.redirect(
      `${process.env.CLIENT_URL}/auth/google/success?id=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}`
    );
  })(req, res, next);
};
