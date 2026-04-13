import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json({
      success: true,
      data: user,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    
    if (req.body.address) {
      user.address.street = req.body.address.street || user.address.street;
      user.address.city = req.body.address.city || user.address.city;
      user.address.province = req.body.address.province || user.address.province;
      user.address.postalCode = req.body.address.postalCode || user.address.postalCode;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
      },
      message: 'Profile updated successfully',
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// --- Wishlist ---

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Filter out inactive products
  const activeWishlist = (user.wishlist || []).filter((p) => p && p.isActive !== false);

  res.json({
    success: true,
    data: activeWishlist,
  });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    res.status(404);
    throw new Error('Product not found');
  }

  const user = await User.findById(req.user._id);

  // Check if already in wishlist
  const alreadyIn = user.wishlist.some((id) => id.toString() === productId);
  if (alreadyIn) {
    res.status(400);
    throw new Error('Already in wishlist');
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { wishlist: productId },
  });

  const updatedUser = await User.findById(req.user._id);

  res.json({
    success: true,
    data: { count: updatedUser.wishlist.length },
    message: 'Added to wishlist',
  });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { wishlist: productId },
  });

  res.json({
    success: true,
    message: 'Removed from wishlist',
  });
});
