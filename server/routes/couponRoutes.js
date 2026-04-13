import express from 'express';
import { validateCoupon } from '../controllers/couponController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/validate', protect, validateCoupon);

export default router;
