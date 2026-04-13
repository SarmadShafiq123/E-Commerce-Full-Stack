import express from 'express';
import {
  getProfile,
  updateProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

router.route('/wishlist').get(protect, getWishlist);
router.route('/wishlist/:id').post(protect, addToWishlist).delete(protect, removeFromWishlist);

export default router;
