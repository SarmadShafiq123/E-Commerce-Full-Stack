import express from 'express';
import { getAllOrders, updateOrder, getStats, getAnalytics } from '../controllers/adminController.js';
import { downloadInvoice, emailInvoice } from '../controllers/invoiceController.js';
import { getInventory, updateStock, toggleActive, bulkUpdateInventory, getLowStockAlerts } from '../controllers/inventoryController.js';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/couponController.js';
import { getAllReviews, updateReview, deleteReview } from '../controllers/reviewController.js';
import { getNotifications, markRead, markOneRead, deleteNotification } from '../controllers/notificationController.js';
import { updateOffer } from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';
import AuditLog from '../models/AuditLog.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();
router.use(protect, adminOnly);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrder);
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/orders/:id/invoice', downloadInvoice);
router.post('/orders/:id/invoice/email', emailInvoice);

// Inventory
router.get('/inventory', getInventory);
router.get('/inventory/alerts', getLowStockAlerts);
router.patch('/inventory/bulk', bulkUpdateInventory);
router.patch('/inventory/:id/stock', updateStock);
router.patch('/inventory/:id/toggle', toggleActive);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Reviews
router.get('/reviews', getAllReviews);
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

// Offers
router.patch('/products/:id/offer', updateOffer);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markRead);
router.patch('/notifications/:id/read', markOneRead);
router.delete('/notifications/:id', deleteNotification);

// Audit logs
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.action)       filter.action       = req.query.action;
  if (req.query.userId)       filter.userId        = req.query.userId;
  if (req.query.resourceType) filter.resourceType  = req.query.resourceType;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email role'),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ success: true, data: logs, total, page, pages: Math.ceil(total / limit) });
}));

export default router;
