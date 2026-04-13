import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import hpp from 'hpp';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { generalLimiter } from './middleware/rateLimitMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import homepageRoutes from './routes/homepageRoutes.js';
import passportConfig from './config/passport.js';
import User from './models/User.js';

connectDB();

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — must come before cookie-parser so preflight works ─────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true, // required for cookies
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));        // cap body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Sanitization ──────────────────────────────────────────────────────────────
app.use(mongoSanitize());   // strip $gt, $ne, etc. from req.body / params / query
app.use(xssClean());        // strip XSS payloads from req.body / params / query
app.use(hpp());             // prevent HTTP parameter pollution

// ── General rate limiter (all /api/* routes) ──────────────────────────────────
app.use('/api', generalLimiter);

// ── Session (Passport) ────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
}));

app.use(passportConfig.initialize());
app.use(passportConfig.session());
app.set('passport', passportConfig);

passportConfig.serializeUser((user, done) => done(null, user.id));
passportConfig.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Luxe Bags API is running' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/coupons',  couponRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/homepage', homepageRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
