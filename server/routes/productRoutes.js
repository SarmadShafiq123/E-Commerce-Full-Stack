import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getAllProductsAdmin,
  updateOffer,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';
import { uploadProductImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, adminOnly, uploadProductImages, createProduct);

router.get('/admin/all', protect, adminOnly, getAllProductsAdmin);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, adminOnly, uploadProductImages, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

router.delete('/:id/images/:public_id', protect, adminOnly, deleteProductImage);
router.patch('/:id/offer', protect, adminOnly, updateOffer);

export default router;
