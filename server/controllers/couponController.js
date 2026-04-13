import asyncHandler from 'express-async-handler';
import Coupon from '../models/Coupon.js';

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: coupons });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minOrderValue, usageLimit, expiryDate, isActive } = req.body;

  const exists = await Coupon.findOne({ code: code?.toUpperCase() });
  if (exists) { res.status(400); throw new Error('Coupon code already exists'); }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    minOrderValue: minOrderValue || 0,
    usageLimit: usageLimit || null,
    expiryDate: expiryDate || null,
    isActive: isActive !== false,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: coupon, message: 'Coupon created' });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }

  const fields = ['code', 'discountType', 'discountValue', 'minOrderValue', 'usageLimit', 'expiryDate', 'isActive'];
  fields.forEach((f) => { if (req.body[f] !== undefined) coupon[f] = req.body[f]; });

  await coupon.save();
  res.json({ success: true, data: coupon, message: 'Coupon updated' });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }
  res.json({ success: true, message: 'Coupon deleted' });
});

// ── Customer: validate coupon ─────────────────────────────────────────────────

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.body;

  if (!code) { res.status(400); throw new Error('Coupon code is required'); }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon || !coupon.isActive) {
    res.status(400); throw new Error('Invalid or inactive coupon');
  }
  if (coupon.expiryDate && new Date() > coupon.expiryDate) {
    res.status(400); throw new Error('Coupon has expired');
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    res.status(400); throw new Error('Coupon usage limit reached');
  }
  if (orderTotal < coupon.minOrderValue) {
    res.status(400);
    throw new Error(`Minimum order value of Rs. ${coupon.minOrderValue} required`);
  }

  const discount = coupon.discountType === 'percentage'
    ? Math.round((orderTotal * coupon.discountValue) / 100)
    : Math.min(coupon.discountValue, orderTotal);

  res.json({
    success: true,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      finalTotal: orderTotal - discount,
    },
  });
});
