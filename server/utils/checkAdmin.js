import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const checkAdmin = async () => {
  try {
    await connectDB();

    console.log('Checking for admin user...');
    console.log('Looking for email:', process.env.ADMIN_EMAIL);

    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (admin) {
      console.log('\n✓ Admin user found!');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Password is hashed:', admin.password.substring(0, 20) + '...');
      
      // Test password
      const testPassword = process.env.ADMIN_PASSWORD;
      const isMatch = await admin.matchPassword(testPassword);
      console.log('\nPassword test with ADMIN_PASSWORD from .env:', isMatch ? '✓ MATCH' : '✗ NO MATCH');
    } else {
      console.log('\n✗ Admin user NOT found!');
      console.log('Please run: npm run seed');
    }

    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkAdmin();
