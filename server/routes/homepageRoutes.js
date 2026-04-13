import express from 'express';
import {
  getHomepage,
  getHomepageAdmin,
  updateHomepage,
  addSlide,
  updateSlide,
  deleteSlide,
  trackSlideClick,
} from '../controllers/homepageController.js';
import { protect } from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';
import { uploadSlideImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public
router.get('/', getHomepage);
router.patch('/slide/:id/click', trackSlideClick);

// Admin protected
router.get('/admin', protect, adminOnly, getHomepageAdmin);
router.put('/', protect, adminOnly, updateHomepage);
router.post('/slide', protect, adminOnly, uploadSlideImage, addSlide);
router.put('/slide/:id', protect, adminOnly, uploadSlideImage, updateSlide);
router.delete('/slide/:id', protect, adminOnly, deleteSlide);

export default router;
