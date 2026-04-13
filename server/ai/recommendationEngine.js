/**
 * Recommendation Engine — pure JS collaborative + content-based hybrid.
 * No external dependencies.
 */
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const CATEGORIES = ['handbags','tote-bags','clutches','shoulder-bags','crossbody','wallets'];

// ── Cache ─────────────────────────────────────────────────────────────────────
let popularCache = null;
let popularCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

// ── Cosine similarity between two plain objects (same keys) ───────────────────
const cosineSim = (a, b) => {
  const keys = Object.keys(a);
  const dot  = keys.reduce((s, k) => s + (a[k] || 0) * (b[k] || 0), 0);
  const magA = Math.sqrt(keys.reduce((s, k) => s + (a[k] || 0) ** 2, 0));
  const magB = Math.sqrt(keys.reduce((s, k) => s + (b[k] || 0) ** 2, 0));
  return magA && magB ? dot / (magA * magB) : 0;
};

// ── Feature vector for a product ─────────────────────────────────────────────
const productVector = (p, maxPrice = 50000) => {
  const v = {};
  CATEGORIES.forEach((c) => { v[c] = p.category === c ? 1 : 0; });
  v.price    = Math.min(p.price / maxPrice, 1);
  v.inStock  = p.stock > 0 ? 1 : 0;
  return v;
};

// ── Popularity-based (cold start) ────────────────────────────────────────────
export const getPopularProducts = async (limit = 8) => {
  const now = Date.now();
  if (popularCache && now - popularCacheTime < CACHE_TTL) return popularCache;

  const topSold = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
    { $sort: { count: -1 } },
    { $limit: limit * 2 },
  ]);

  const ids      = topSold.map((t) => t._id);
  const products = await Product.find({ _id: { $in: ids }, isActive: true });

  const sorted = products.sort((a, b) => {
    const ac = topSold.find((t) => t._id.toString() === a._id.toString())?.count || 0;
    const bc = topSold.find((t) => t._id.toString() === b._id.toString())?.count || 0;
    return bc - ac;
  });

  if (sorted.length < limit) {
    const extra = await Product.find({ isActive: true, _id: { $nin: ids } })
      .sort({ createdAt: -1 }).limit(limit - sorted.length);
    sorted.push(...extra);
  }

  popularCache     = sorted.slice(0, limit);
  popularCacheTime = now;
  return popularCache;
};

// ── Personalised recommendations ─────────────────────────────────────────────
export const getPersonalisedRecommendations = async (userId, limit = 8) => {
  try {
    const [orders, user] = await Promise.all([
      Order.find({ user: userId }).populate('items.product'),
      User.findById(userId).populate('wishlist'),
    ]);

    const purchasedIds  = new Set();
    const categoryScore = {};
    let   totalItems    = 0;
    let   totalSpend    = 0;

    for (const order of orders) {
      for (const item of order.items) {
        if (!item.product) continue;
        purchasedIds.add(item.product._id.toString());
        const cat = item.product.category;
        categoryScore[cat] = (categoryScore[cat] || 0) + item.quantity;
        totalSpend += item.price * item.quantity;
        totalItems += item.quantity;
      }
    }

    for (const p of (user?.wishlist || [])) {
      if (p?.category) categoryScore[p.category] = (categoryScore[p.category] || 0) + 0.5;
    }

    if (totalItems === 0 && !user?.wishlist?.length) {
      return getPopularProducts(limit);
    }

    // Build user preference vector
    const total    = Object.values(categoryScore).reduce((s, v) => s + v, 0) || 1;
    const avgSpend = totalSpend / Math.max(totalItems, 1);
    const maxPrice = 50000;

    const userVec = {};
    CATEGORIES.forEach((c) => { userVec[c] = (categoryScore[c] || 0) / total; });
    userVec.price   = Math.min(avgSpend / maxPrice, 1);
    userVec.inStock = 1;

    // Score all unseen active products by cosine similarity to user vector
    const candidates = await Product.find({
      isActive: true,
      _id: { $nin: [...purchasedIds] },
    });

    const scored = candidates.map((p) => ({
      product: p,
      score:   cosineSim(userVec, productVector(p, maxPrice)) - (p.stock === 0 ? 0.3 : 0),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.product);
  } catch (err) {
    console.error('[AI] Recommendation error:', err.message);
    return getPopularProducts(limit);
  }
};

// ── Trending (admin analytics) ────────────────────────────────────────────────
export const getTrendingProducts = async (days = 7, limit = 5) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $unwind: '$items' },
    {
      $group: {
        _id:       '$items.product',
        name:      { $first: '$items.name' },
        image:     { $first: '$items.image' },
        unitsSold: { $sum: '$items.quantity' },
        revenue:   { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]);
};
