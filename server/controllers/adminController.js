import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { orderShippedTemplate, orderDeliveredTemplate } from '../utils/emailTemplates.js';
import { buildShippedMessage, buildDeliveredMessage, sendWhatsAppNotification } from '../utils/sendWhatsApp.js';
import audit from '../utils/auditLogger.js';

export const getAllOrders = asyncHandler(async (req, res) => {
  let query = {};

  if (req.query.status) {
    query.orderStatus = req.query.status;
  }

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders,
  });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const oldStatus = order.orderStatus;

  if (req.body.orderStatus) order.orderStatus = req.body.orderStatus;
  if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
  if (req.body.adminNote !== undefined) order.adminNote = req.body.adminNote;
  if (req.body.trackingNumber !== undefined) order.trackingNumber = req.body.trackingNumber;
  if (req.body.courierName !== undefined) order.courierName = req.body.courierName;

  // Append to status history when status changes
  const newStatus = req.body.orderStatus || oldStatus;
  if (req.body.orderStatus && oldStatus !== newStatus) {
    order.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      note: req.body.adminNote || '',
    });
  }

  const updatedOrder = await order.save();

  // Fire notifications only on actual status change
  if (req.body.orderStatus && oldStatus !== newStatus) {
    audit({
      action: 'ORDER_STATUS_CHANGE',
      user: req.user,
      req,
      resourceType: 'Order',
      resourceId: order._id,
      metadata: { from: oldStatus, to: newStatus },
    });
    const userEmail = order.user?.email;
    const userPhone = order.shippingAddress?.phone;

    if (newStatus === 'shipped') {
      // Email
      if (userEmail) {
        try {
          await sendEmail({
            to: userEmail,
            subject: `Your Order Has Been Shipped — #${updatedOrder._id}`,
            html: orderShippedTemplate(updatedOrder),
          });
        } catch (e) { console.error('[Email] Shipped notification failed:', e.message); }
      }
      // WhatsApp
      sendWhatsAppNotification(userPhone, buildShippedMessage(updatedOrder));
    }

    if (newStatus === 'delivered') {
      if (userEmail) {
        try {
          await sendEmail({
            to: userEmail,
            subject: `Order Delivered — Thank You! — #${updatedOrder._id}`,
            html: orderDeliveredTemplate(updatedOrder),
          });
        } catch (e) { console.error('[Email] Delivered notification failed:', e.message); }
      }
      sendWhatsAppNotification(userPhone, buildDeliveredMessage(updatedOrder));
    }
  }

  res.json({
    success: true,
    data: updatedOrder,
    message: 'Order updated successfully',
  });
});

export const getStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
  const totalCustomers = await User.countDocuments({ role: 'user' });
  const totalProducts = await Product.countDocuments({ isActive: true });

  const revenueResult = await Order.aggregate([
    { $match: { paymentStatus: 'verified' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const revenue = revenueResult[0]?.total || 0;

  // Revenue this month vs last month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'verified', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'verified', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      revenue,
      totalCustomers,
      totalProducts,
      thisMonthRevenue: thisMonthRevenue[0]?.total || 0,
      lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
    },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();

  // --- Monthly revenue for last 6 months ---
  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'verified',
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // --- Monthly orders (all statuses) for last 6 months ---
  const monthlyOrders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // --- Sales by category ---
  const categoryRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'verified' } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmpty: true } },
    {
      $group: {
        _id: '$productInfo.category',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        unitsSold: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // --- Top selling products ---
  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
  ]);

  // --- Order status breakdown ---
  const orderStatusBreakdown = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // --- Payment method breakdown ---
  const paymentMethodBreakdown = await Order.aggregate([
    { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // --- Wishlist activity: most wishlisted products ---
  const wishlistActivity = await User.aggregate([
    { $unwind: '$wishlist' },
    { $group: { _id: '$wishlist', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 1,
        count: 1,
        name: '$product.name',
        image: { $arrayElemAt: ['$product.images.url', 0] },
        category: '$product.category',
        price: '$product.price',
      },
    },
  ]);

  // --- New customers per month (last 6 months) ---
  const newCustomers = await User.aggregate([
    {
      $match: {
        role: 'user',
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    success: true,
    data: {
      monthlyRevenue,
      monthlyOrders,
      categoryRevenue,
      topProducts,
      orderStatusBreakdown,
      paymentMethodBreakdown,
      wishlistActivity,
      newCustomers,
    },
  });
});
