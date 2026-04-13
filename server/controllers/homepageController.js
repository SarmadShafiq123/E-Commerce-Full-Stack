import asyncHandler from 'express-async-handler';
import Homepage from '../models/Homepage.js';
import cloudinary from '../config/cloudinary.js';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Get or create the singleton homepage document */
const getOrCreate = async () => {
  let doc = await Homepage.findOne();
  if (!doc) doc = await Homepage.create({});
  return doc;
};

/** Filter slides that are currently scheduled/active */
const isSlideVisible = (slide) => {
  if (!slide.active) return false;
  const now = new Date();
  if (slide.startDate && now < new Date(slide.startDate)) return false;
  if (slide.endDate && now > new Date(slide.endDate)) return false;
  return true;
};

// ── controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/homepage
 * Public — returns published config with only active/scheduled slides
 */
export const getHomepage = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();

  const visibleSlides = doc.heroSlider
    .filter(isSlideVisible)
    .sort((a, b) => a.order - b.order);

  res.json({
    topBar: doc.topBar,
    heroSlider: visibleSlides,
    published: doc.published,
  });
});

/**
 * GET /api/homepage/admin
 * Admin — returns full config including inactive slides
 */
export const getHomepageAdmin = asyncHandler(async (req, res) => {
  const doc = await getOrCreate();
  res.json(doc);
});

/**
 * PUT /api/homepage
 * Admin — update top bar + publish state
 */
export const updateHomepage = asyncHandler(async (req, res) => {
  const { topBar, published } = req.body;
  const doc = await getOrCreate();

  if (topBar !== undefined) {
    doc.topBar = { ...doc.topBar, ...topBar };
  }
  if (published !== undefined) {
    doc.published = published;
  }

  await doc.save();
  res.json(doc);
});

/**
 * POST /api/homepage/slide
 * Admin — add a new slide (image uploaded via multer/cloudinary)
 */
export const addSlide = asyncHandler(async (req, res) => {
  const { title, subtitle, buttonText, link, active, order, startDate, endDate } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Slide title is required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Slide image is required');
  }

  const doc = await getOrCreate();

  const newSlide = {
    title,
    subtitle: subtitle || '',
    image: req.file.path,
    imagePublicId: req.file.filename,
    buttonText: buttonText || 'Shop Now',
    link: link || '/products',
    active: active !== undefined ? active === 'true' || active === true : true,
    order: order !== undefined ? Number(order) : doc.heroSlider.length,
    startDate: startDate || null,
    endDate: endDate || null,
  };

  doc.heroSlider.push(newSlide);
  await doc.save();

  res.status(201).json(doc.heroSlider[doc.heroSlider.length - 1]);
});

/**
 * PUT /api/homepage/slide/:id
 * Admin — update a slide (optionally replace image)
 */
export const updateSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, buttonText, link, active, order, startDate, endDate } = req.body;

  const doc = await getOrCreate();
  const slide = doc.heroSlider.id(id);

  if (!slide) {
    res.status(404);
    throw new Error('Slide not found');
  }

  // If a new image was uploaded, delete the old one from Cloudinary
  if (req.file) {
    if (slide.imagePublicId) {
      await cloudinary.uploader.destroy(slide.imagePublicId).catch(() => {});
    }
    slide.image = req.file.path;
    slide.imagePublicId = req.file.filename;
  }

  if (title !== undefined) slide.title = title;
  if (subtitle !== undefined) slide.subtitle = subtitle;
  if (buttonText !== undefined) slide.buttonText = buttonText;
  if (link !== undefined) slide.link = link;
  if (active !== undefined) slide.active = active === 'true' || active === true;
  if (order !== undefined) slide.order = Number(order);
  if (startDate !== undefined) slide.startDate = startDate || null;
  if (endDate !== undefined) slide.endDate = endDate || null;

  await doc.save();
  res.json(slide);
});

/**
 * DELETE /api/homepage/slide/:id
 * Admin — delete a slide and its Cloudinary image
 */
export const deleteSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await getOrCreate();
  const slide = doc.heroSlider.id(id);

  if (!slide) {
    res.status(404);
    throw new Error('Slide not found');
  }

  if (slide.imagePublicId) {
    await cloudinary.uploader.destroy(slide.imagePublicId).catch(() => {});
  }

  slide.deleteOne();
  await doc.save();

  res.json({ message: 'Slide deleted' });
});

/**
 * PATCH /api/homepage/slide/:id/click
 * Public — increment click counter for analytics
 */
export const trackSlideClick = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await getOrCreate();
  const slide = doc.heroSlider.id(id);

  if (slide) {
    slide.clicks += 1;
    await doc.save();
  }

  res.json({ ok: true });
});
