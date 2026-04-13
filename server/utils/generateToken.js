import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import RefreshToken from '../models/RefreshToken.js';

// ── Access token (short-lived JWT) ────────────────────────────────────────────

/**
 * Generates a short-lived access token (15 min).
 * Payload is minimal — role is re-verified from DB in protect middleware.
 */
export const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

// ── Refresh token (long-lived, stored in DB) ──────────────────────────────────

const REFRESH_TTL_DAYS = 30;

/**
 * Creates a new refresh token document in DB.
 * @param {ObjectId} userId
 * @param {string}   familyId  - pass existing familyId when rotating; omit for new login
 * @param {object}   meta      - { ip, userAgent }
 * @returns {string} raw token string (stored in httpOnly cookie)
 */
export const createRefreshToken = async (userId, familyId, meta = {}) => {
  const token = crypto.randomBytes(64).toString('hex');
  const family = familyId || uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    token,
    user: userId,
    familyId: family,
    expiresAt,
    ip: meta.ip || '',
    userAgent: meta.userAgent || '',
  });

  return token;
};

/**
 * Rotates a refresh token:
 * 1. Validates the incoming token
 * 2. Detects reuse (revoked token → wipe entire family)
 * 3. Revokes old token, issues new one in same family
 *
 * @returns {{ newRefreshToken, user }}
 * @throws  Error with appropriate message on any failure
 */
export const rotateRefreshToken = async (incomingToken, meta = {}) => {
  const existing = await RefreshToken.findOne({ token: incomingToken }).populate('user');

  if (!existing) {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  // Reuse detection — token was already revoked (used before)
  if (existing.revoked) {
    // Wipe the entire family to force re-login on all devices in this chain
    await RefreshToken.updateMany(
      { familyId: existing.familyId },
      { revoked: true }
    );
    throw Object.assign(
      new Error('Refresh token reuse detected. Please log in again.'),
      { status: 401, code: 'TOKEN_REUSE' }
    );
  }

  // Expired check (belt-and-suspenders — TTL index handles DB cleanup)
  if (existing.expiresAt < new Date()) {
    existing.revoked = true;
    await existing.save();
    throw Object.assign(new Error('Refresh token expired'), { status: 401 });
  }

  const user = existing.user;
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 401 });
  }

  // Revoke old token
  const newToken = crypto.randomBytes(64).toString('hex');
  existing.revoked = true;
  existing.replacedBy = newToken;
  await existing.save();

  // Issue new token in same family
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    token: newToken,
    user: user._id,
    familyId: existing.familyId,
    expiresAt,
    ip: meta.ip || '',
    userAgent: meta.userAgent || '',
  });

  return { newRefreshToken: newToken, user };
};

/**
 * Revokes all refresh tokens for a user (logout all devices).
 */
export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany({ user: userId, revoked: false }, { revoked: true });
};

// ── Legacy default export (kept for any remaining callers) ───────────────────
export default generateAccessToken;
