import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';

// ── Customer: submit review ───────────────────────────────────────────────────

export const submitReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, title, body } = req.body;

  // Verify the user actually ordered this product
  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
    'items.product': productId,
    orderStatus: 'delivered',
  });

  if (!order) {
    res.status(403);
    throw new Error('You can only review products from delivered orders');
  }

  // Prevent duplicate
  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) { res.status(400); throw new Error('You have already reviewed this product'); }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    order: orderId,
    rating,
    title,
    body,
    status: 'pending',
  });

  // Notify admin
  await Notification.create({
    type: 'new_review',
    title: 'New Review Submitted',
    message: `${req.user.name} submitted a ${rating}★ review — awaiting approval.`,
    product: productId,
    review: review._id,
  });

  res.status(201).json({ success: true, data: review, message: 'Review submitted for approval' });
});

// ── Public: get approved reviews for a product ────────────────────────────────

export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'approved' })
    .populate('user', 'name avatar')
    .sort({ isFeatured: -1, createdAt: -1 });

  const total = reviews.length;
  const avgRating = total > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
    : 0;

  res.json({ success: true, data: reviews, meta: { total, avgRating } });
});

// ── Admin: get all reviews ────────────────────────────────────────────────────

export const getAllReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const reviews = await Review.find(filter)
    .populate('user', 'name email')
    .populate('product', 'name images')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reviews });
});

// ── Admin: approve / reject / feature ────────────────────────────────────────

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }

  if (req.body.status !== undefined) review.status = req.body.status;
  if (req.body.isFeatured !== undefined) review.isFeatured = req.body.isFeatured;

  await review.save();
  res.json({ success: true, data: review, message: 'Review updated' });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  res.json({ success: true, message: 'Review deleted' });
});
