import asyncHandler from 'express-async-handler';
import { analyzeSentiment } from '../ai/sentimentEngine.js';
import { getPersonalisedRecommendations, getPopularProducts, getTrendingProducts } from '../ai/recommendationEngine.js';
import { processMessage, DEFAULT_RESPONSES, INTENTS } from '../ai/chatbotEngine.js';
import Review from '../models/Review.js';
import ChatbotResponse from '../models/ChatbotResponse.js';

// ── Recommendations ───────────────────────────────────────────────────────────

export const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const limit  = parseInt(req.query.limit) || 8;

  const products = userId
    ? await getPersonalisedRecommendations(userId, limit)
    : await getPopularProducts(limit);

  res.json({ success: true, data: products });
});

export const getTrending = asyncHandler(async (req, res) => {
  const days  = parseInt(req.query.days)  || 7;
  const limit = parseInt(req.query.limit) || 5;
  const data  = await getTrendingProducts(days, limit);
  res.json({ success: true, data });
});

// ── Sentiment ─────────────────────────────────────────────────────────────────

export const analyseReview = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) { res.status(400); throw new Error('Text is required'); }
  const result = analyzeSentiment(text);
  res.json({ success: true, data: result });
});

/** Run sentiment on all pending reviews and attach results */
export const batchAnalyseReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: 'pending' }).select('_id title body rating');

  const results = reviews.map((r) => {
    const text = `${r.title || ''} ${r.body || ''}`.trim();
    const ai   = analyzeSentiment(text);
    return {
      _id:       r._id,
      sentiment: ai.sentiment,
      isSpam:    ai.isSpam,
      scores:    ai.scores,
      rating:    r.rating,
    };
  });

  res.json({ success: true, data: results });
});

// ── Chatbot ───────────────────────────────────────────────────────────────────

export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) { res.status(400); throw new Error('Message is required'); }

  // Load admin-customised responses
  const customDocs = await ChatbotResponse.find({ isActive: true });
  const customResponses = {};
  customDocs.forEach((d) => { customResponses[d.intent] = d.response; });

  const result = processMessage(message, customResponses);
  res.json({ success: true, data: result });
});

export const getChatbotResponses = asyncHandler(async (req, res) => {
  const docs = await ChatbotResponse.find().sort({ intent: 1 });
  // Merge with defaults so admin sees all intents
  const merged = Object.entries(DEFAULT_RESPONSES).map(([intent, defaultText]) => {
    const custom = docs.find((d) => d.intent === intent);
    return {
      intent,
      response: custom?.response || defaultText,
      isCustom: !!custom,
      isActive: custom?.isActive ?? true,
      _id: custom?._id || null,
    };
  });
  res.json({ success: true, data: merged });
});

export const upsertChatbotResponse = asyncHandler(async (req, res) => {
  const { intent, response, isActive } = req.body;
  if (!intent || !response) { res.status(400); throw new Error('intent and response required'); }

  const doc = await ChatbotResponse.findOneAndUpdate(
    { intent },
    { intent, response, isActive: isActive !== false },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: doc, message: 'Response saved' });
});

export const deleteChatbotResponse = asyncHandler(async (req, res) => {
  await ChatbotResponse.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Custom response removed, default restored' });
});
