import mongoose from 'mongoose';

/**
 * Stores refresh tokens in DB for:
 * - revocation on logout / password change
 * - rotation (each use issues a new token, old one is invalidated)
 * - family tracking to detect reuse attacks
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Token family — all tokens in a chain share the same familyId.
    // If a revoked token is reused, the entire family is wiped (reuse detection).
    familyId: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — auto-deletes expired docs
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    replacedBy: {
      type: String,
      default: null, // token string of the next token in the rotation chain
    },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
