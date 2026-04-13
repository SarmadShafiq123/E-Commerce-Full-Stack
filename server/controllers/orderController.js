import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';
import { orderPlacedTemplate } from '../utils/emailTemplates.js';
import audit from '../utils/auditLogger.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, totalPrice, couponCode, discount } = req.body;

  // ── Pre-transaction validation ────────────────────────────────────────────
  let appliedCoupon = null;
  if (couponCode) {
    appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!appliedCoupon) { res.status(400); throw new Error('Invalid coupon code'); }
    if (appliedCoupon.expiryDate && new Date() > appliedCoupon.expiryDate) {
      res.status(400); throw new Error('Coupon has expired');
    }
    if (appliedCoupon.usageLimit !== null && appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
      res.status(400); throw new Error('Coupon usage limit reached');
    }
  }

  // ── MongoDB transaction — atomic stock deduction + order creation ─────────
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      // Lock + validate stock for every item atomically
      for (const item of items) {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            isActive: true,
            stock: { $gte: item.quantity }, // atomic check-and-deduct
          },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!product) {
          // Either not found, inactive, or insufficient stock
          const existing = await Product.findById(item.product).session(session);
          if (!existing || !existing.isActive) {
            throw new Error(`"${item.name}" is no longer available`);
          }
          throw new Error(
            `Insufficient stock for "${item.name}". Available: ${existing.stock}, requested: ${item.quantity}`
          );
        }

        // Queue low-stock notification (non-blocking, outside transaction)
        if (product.stock <= product.lowStockThreshold) {
          Notification.create([{
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `"${product.name}" has only ${product.stock} unit(s) left.`,
            product: product._id,
          }]).catch(() => {});
        }
      }

      // Create order inside the same transaction
      const [created] = await Order.create(
        [{
          user: req.user._id,
          items,
          shippingAddress,
          paymentMethod,
          totalPrice,
          discount: discount || 0,
          couponCode: couponCode || '',
          statusHistory: [{ status: 'pending' }],
        }],
        { session }
      );
      order = created;

      // Increment coupon usage inside transaction
      if (appliedCoupon) {
        await Coupon.findByIdAndUpdate(
          appliedCoupon._id,
          { $inc: { usedCount: 1 } },
          { session }
        );
      }
    });
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  } finally {
    session.endSession();
  }

  // ── Post-transaction side effects (non-atomic, best-effort) ──────────────
  Notification.create({
    type: 'new_order',
    title: 'New Order Received',
    message: `Order #${String(order._id).slice(-8).toUpperCase()} placed by ${req.user.name} — Rs. ${totalPrice}`,
    order: order._id,
  }).catch(() => {});

  sendEmail({
    to: req.user.email,
    subject: `Order Confirmed — #${order._id}`,
    html: orderPlacedTemplate(order),
  }).catch((err) => console.error('[Email] Order confirmation failed:', err.message));

  audit({
    action: 'ORDER_CREATE',
    user: req.user,
    req,
    resourceType: 'Order',
    resourceId: order._id,
    metadata: { totalPrice, itemCount: items.length, paymentMethod },
  });

  res.status(201).json({ success: true, data: order, message: 'Order placed successfully' });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, data: order });
});
