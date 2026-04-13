import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Validate Cloudinary credentials
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('⚠️  WARNING: Cloudinary credentials are missing!');
  console.error('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
  console.error('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
  console.error('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
} else {
  console.log('✓ Cloudinary credentials loaded successfully');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isSlide = req.baseUrl?.includes('homepage');
    return {
      folder: isSlide ? 'luxe-bags/slides' : 'luxe-bags/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: isSlide
        ? [{ width: 1600, height: 700, crop: 'fill', quality: 'auto' }]
        : [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
      public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'));
    }
  },
});

export default cloudinary;
