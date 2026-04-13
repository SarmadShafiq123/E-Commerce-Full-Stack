import express from 'express';
import {
  register,
  login,
  logout,
  logoutAll,
  refresh,
  verifyEmail,
  resendVerification,
  googleAuth,
  googleCallback,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post('/register',             registerLimiter, validateRegister, register);
router.post('/login',                loginLimiter,    validateLogin,    login);
router.post('/refresh',              refresh);          // no auth needed — uses refresh cookie
router.post('/logout',               logout);
router.post('/logout-all',           protect, logoutAll);
router.get('/verify-email/:token',   verifyEmail);
router.post('/resend-verification',  resendVerification);
router.get('/google',                googleAuth);
router.get('/google/callback',       googleCallback);

export default router;
