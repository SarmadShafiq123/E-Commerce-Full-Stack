import express from 'express';
import { createOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateOrder } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.route('/').post(protect, validateOrder, createOrder);
router.route('/my-orders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);

export default router;