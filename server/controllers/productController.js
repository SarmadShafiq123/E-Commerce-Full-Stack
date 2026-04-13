import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import audit from '../utils/auditLogger.js';

export const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  let query = { isActive: true };

  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (req.query.sort === 'price_asc') sortOption = { price: 1 };
  if (req.query.sort === 'price_desc') sortOption = { price: -1 };
  if (req.query.sort === 'newest') sortOption = { createdAt: -1 };

  const total = await Product.countDocuments(query);
  const products = await Product.find(query).sort(sortOption).limit(limit).skip(skip);

  res.json({
    success: true,
    data: products,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product && product.isActive) {
    res.json({
      success: true,
      data: product,
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

export const createProduct = asyncHandler(async (req, res) => {
  try {
    // Debug logs
    console.log('\n📦 ===== CREATE PRODUCT REQUEST =====');
    console.log('Files received:', req.files);
    console.log('Files count:', req.files?.length || 0);
    console.log('Body received:', req.body);
    console.log('User:', req.user?._id);

    const { name, description, price, category, stock, isActive } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      console.error('❌ Missing required fields');
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Validate and parse price
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      console.error('❌ Invalid price:', price);
      res.status(400);
      throw new Error('Invalid price value');
    }

    // Validate and parse stock
    const parsedStock = stock ? parseInt(stock) : 0;
    if (isNaN(parsedStock) || parsedStock < 0) {
      console.error('❌ Invalid stock:', stock);
      res.status(400);
      throw new Error('Invalid stock value');
    }

    // Handle images - CRITICAL: req.files comes from multer-storage-cloudinary
    let images = [];
    if (req.files && req.files.length > 0) {
      console.log('Processing', req.files.length, 'files...');
      images = req.files.map((file, index) => {
        console.log(`File ${index + 1}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          filename: file.filename,
        });
        return {
          url: file.path,
          public_id: file.filename,
        };
      });
      console.log('✓ Mapped images:', images);
    } else {
      console.log('⚠️  No images uploaded');
    }

    // Explicitly parse isActive — FormData always sends strings
    const activeStatus = isActive === 'true';

    console.log('Creating product with data:', {
      name: name.trim(),
      price: parsedPrice,
      category,
      stock: parsedStock,
      isActive: activeStatus,
      imagesCount: images.length,
    });

    // Use new + save() so we await the DB write before returning 201
    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      category,
      stock: parsedStock,
      isActive: activeStatus,
      images,
      createdBy: req.user._id,
    });

    await product.save();

    console.log('✓ Product created successfully:', product._id);
    console.log('===== END CREATE PRODUCT =====\n');

    audit({
      action: 'PRODUCT_CREATE',
      user: req.user,
      req,
      resourceType: 'Product',
      resourceId: product._id,
      metadata: { name: product.name, category: product.category, price: product.price },
    });

    return res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('\n❌ ===== CREATE PRODUCT ERROR =====');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===== END ERROR =====\n');

    // Handle Mongoose validation errors — return explicit 400 JSON
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    throw error;
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Update fields
    if (req.body.name) product.name = req.body.name.trim();
    if (req.body.description) product.description = req.body.description.trim();
    
    if (req.body.price !== undefined) {
      const parsedPrice = parseFloat(req.body.price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        res.status(400);
        throw new Error('Invalid price value');
      }
      product.price = parsedPrice;
    }
    
    if (req.body.category) product.category = req.body.category;
    
    if (req.body.stock !== undefined) {
      const parsedStock = parseInt(req.body.stock);
      if (isNaN(parsedStock) || parsedStock < 0) {
        res.status(400);
        throw new Error('Invalid stock value');
      }
      product.stock = parsedStock;
    }
    
    if (req.body.isActive !== undefined) {
      product.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const img of product.images) {
        try {
          await cloudinary.uploader.destroy(img.public_id);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
      
      // Add new images
      product.images = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    const updatedProduct = await product.save();

    audit({
      action: 'PRODUCT_UPDATE',
      user: req.user,
      req,
      resourceType: 'Product',
      resourceId: product._id,
      metadata: { name: updatedProduct.name },
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully',
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      res.status(400);
      throw new Error(messages.join(', '));
    }
    throw error;
  }
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  for (const img of product.images) {
    await cloudinary.uploader.destroy(img.public_id);
  }

  await Product.findByIdAndDelete(req.params.id);

  audit({
    action: 'PRODUCT_DELETE',
    user: req.user,
    req,
    resourceType: 'Product',
    resourceId: req.params.id,
    metadata: { name: product.name },
  });

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

export const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const imageIndex = product.images.findIndex(
    (img) => img.public_id === req.params.public_id
  );

  if (imageIndex === -1) {
    res.status(404);
    throw new Error('Image not found');
  }

  await cloudinary.uploader.destroy(req.params.public_id);
  product.images.splice(imageIndex, 1);
  await product.save();

  res.json({
    success: true,
    data: product,
    message: 'Image deleted successfully',
  });
});

export const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Product.countDocuments();
  const products = await Product.find().sort({ createdAt: -1 }).limit(limit).skip(skip);

  res.json({
    success: true,
    data: products,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// ── Offer / Flash Sale ────────────────────────────────────────────────────────

export const updateOffer = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const { offerPrice, offerStart, offerEnd } = req.body;

  // Clear offer
  if (req.body.clearOffer) {
    product.offerPrice = null;
    product.offerStart = null;
    product.offerEnd   = null;
  } else {
    if (offerPrice !== undefined) {
      const p = parseFloat(offerPrice);
      if (isNaN(p) || p < 0 || p >= product.price) {
        res.status(400); throw new Error('Offer price must be less than regular price');
      }
      product.offerPrice = p;
    }
    if (offerStart !== undefined) product.offerStart = offerStart ? new Date(offerStart) : null;
    if (offerEnd   !== undefined) product.offerEnd   = offerEnd   ? new Date(offerEnd)   : null;
  }

  await product.save();
  res.json({ success: true, data: product, message: 'Offer updated' });
});
