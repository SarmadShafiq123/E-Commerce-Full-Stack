import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Slide title is required'] },
    subtitle: { type: String, default: '' },
    image: { type: String, required: [true, 'Slide image is required'] },
    imagePublicId: { type: String, default: '' },
    buttonText: { type: String, default: 'Shop Now' },
    link: { type: String, default: '/products' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    // Optional scheduling
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // Analytics
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const homepageSchema = new mongoose.Schema(
  {
    topBar: {
      text: { type: String, default: 'Free shipping on orders over Rs. 5,000' },
      link: { type: String, default: '' },
      active: { type: Boolean, default: true },
    },
    heroSlider: [slideSchema],
    // Draft vs publish
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Homepage = mongoose.model('Homepage', homepageSchema);

export default Homepage;
