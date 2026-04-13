import { upload } from '../config/cloudinary.js';

export const uploadProductImages = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      console.error('❌ Multer/Cloudinary upload error:', err);
      res.status(400);
      return next(new Error(`Image upload failed: ${err.message}`));
    }
    next();
  });
};

export const uploadSlideImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Slide image upload error:', err);
      res.status(400);
      return next(new Error(`Image upload failed: ${err.message}`));
    }
    next();
  });
};
