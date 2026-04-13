import 'dotenv/config';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

const sampleProducts = [
  {
    name: 'Classic Leather Handbag',
    description: 'A timeless leather handbag crafted from premium full-grain leather. Features a spacious interior with multiple compartments.',
    price: 8500,
    category: 'handbags',
    stock: 15,
    isActive: true,
    images: [{ url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', public_id: 'sample_handbag_1' }],
  },
  {
    name: 'Minimalist Tote Bag',
    description: 'Sleek and spacious tote bag perfect for everyday use. Made from durable canvas with leather handles.',
    price: 4200,
    category: 'tote-bags',
    stock: 20,
    isActive: true,
    images: [{ url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600', public_id: 'sample_tote_1' }],
  },
  {
    name: 'Evening Clutch',
    description: 'Elegant evening clutch with gold-tone hardware. Perfect for formal occasions and night outs.',
    price: 3200,
    category: 'clutches',
    stock: 10,
    isActive: true,
    images: [{ url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600', public_id: 'sample_clutch_1' }],
  },
  {
    name: 'Crossbody Sling Bag',
    description: 'Compact and stylish crossbody bag with adjustable strap. Ideal for travel and daily errands.',
    price: 5500,
    category: 'crossbody',
    stock: 18,
    isActive: true,
    images: [{ url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e5b?w=600', public_id: 'sample_crossbody_1' }],
  },
  {
    name: 'Leather Shoulder Bag',
    description: 'Sophisticated shoulder bag with soft leather exterior and suede lining. Features a detachable strap.',
    price: 7200,
    category: 'shoulder-bags',
    stock: 12,
    isActive: true,
    images: [{ url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', public_id: 'sample_shoulder_1' }],
  },
  {
    name: 'Slim Card Wallet',
    description: 'Ultra-slim genuine leather wallet with RFID blocking. Holds up to 8 cards plus cash.',
    price: 1800,
    category: 'wallets',
    stock: 30,
    isActive: true,
    images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600', public_id: 'sample_wallet_1' }],
  },
];

const seedAdmin = async () => {
  try {
    await connectDB();

    // Seed admin user
    let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (admin) {
      console.log('✓ Admin user already exists');
    } else {
      admin = await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        emailVerified: true,
      });
      console.log(`✓ Admin created — Email: ${admin.email}`);
    }

    // Seed sample products
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`✓ Products already exist (${existingCount} found), skipping product seed`);
    } else {
      const products = sampleProducts.map((p) => ({ ...p, createdBy: admin._id }));
      await Product.insertMany(products);
      console.log(`✓ ${products.length} sample products created`);
    }

    console.log('\nSeeding complete.');
    process.exit();
  } catch (error) {
    console.error(`Seeder error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
