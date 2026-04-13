import rateLimit from 'express-rate-limit';

const rateLimitMessage = { success: false, message: 'Too many requests, please try again later.' };

/** Login — 5 attempts per 15 min per IP */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Register — 3 requests per 15 min per IP */
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API fallback — 100 requests per 15 min per IP */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
});
