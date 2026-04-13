import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

/**
 * GET /api/admin/inventory
 * All products with stock info, sorted by stock asc (low stock first).
 * Supports ?lowStock=true to filter only below-threshold products.
 */
export const getInventory = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.lowStock === 'true') {
    // MongoDB can't compare two fields in a simple query without $expr
    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const products = await Product.find(filter)
    .select('name category stock isActive lowStockThreshold images price')
    .sort({ stock: 1, createdAt: -1 });

  // Attach a computed flag for convenience
  const data = products.map((p) => ({
    ...p.toObject(),
    isLowStock: p.stock <= p.lowStockThreshold,
    isOutOfStock: p.stock === 0,
  }));

  const lowStockCount = data.filter((p) => p.isLowStock && p.stock > 0).length;
  const outOfStockCount = data.filter((p) => p.isOutOfStock).length;

  res.json({
    success: true,
    data,
    meta: { total: data.length, lowStockCount, outOfStockCount },
  });
});

/**
 * PATCH /api/admin/inventory/:id/stock
 * Update stock + optional lowStockThreshold for a single product.
 * Body: { stock, lowStockThreshold }
 */
export const updateStock = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  if (req.body.stock !== undefined) {
    const val = parseInt(req.body.stock);
    if (isNaN(val) || val < 0) { res.status(400); throw new Error('Invalid stock value'); }
    product.stock = val;
  }

  if (req.body.lowStockThreshold !== undefined) {
    const val = parseInt(req.body.lowStockThreshold);
    if (isNaN(val) || val < 0) { res.status(400); throw new Error('Invalid threshold value'); }
    product.lowStockThreshold = val;
  }

  await product.save();

  res.json({
    success: true,
    data: {
      ...product.toObject(),
      isLowStock: product.stock <= product.lowStockThreshold,
      isOutOfStock: product.stock === 0,
    },
    message: 'Stock updated',
  });
});

/**
 * PATCH /api/admin/inventory/:id/toggle
 * Toggle isActive for a single product.
 */
export const toggleActive = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  product.isActive = !product.isActive;
  await product.save();

  res.json({
    success: true,
    data: { _id: product._id, isActive: product.isActive },
    message: `Product ${product.isActive ? 'activated' : 'deactivated'}`,
  });
});

/**
 * PATCH /api/admin/inventory/bulk
 * Bulk update stock or isActive for multiple products.
 * Body: { updates: [{ id, stock?, lowStockThreshold?, isActive? }] }
 */
export const bulkUpdateInventory = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400);
    throw new Error('No updates provided');
  }

  const results = await Promise.allSettled(
    updates.map(async ({ id, stock, lowStockThreshold, isActive }) => {
      const product = await Product.findById(id);
      if (!product) throw new Error(`Product ${id} not found`);

      if (stock !== undefined) {
        const val = parseInt(stock);
        if (isNaN(val) || val < 0) throw new Error(`Invalid stock for ${id}`);
        product.stock = val;
      }
      if (lowStockThreshold !== undefined) {
        const val = parseInt(lowStockThreshold);
        if (!isNaN(val) && val >= 0) product.lowStockThreshold = val;
      }
      if (isActive !== undefined) product.isActive = Boolean(isActive);

      await product.save();
      return { id: product._id, stock: product.stock, isActive: product.isActive };
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed    = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);

  res.json({ success: true, data: { succeeded, failed } });
});

/**
 * GET /api/admin/inventory/alerts
 * Returns only products at or below their lowStockThreshold.
 * Used by the sidebar badge.
 */
export const getLowStockAlerts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    isActive: true,
  }).select('name stock lowStockThreshold images category');

  res.json({
    success: true,
    data: products,
    count: products.length,
  });
});
