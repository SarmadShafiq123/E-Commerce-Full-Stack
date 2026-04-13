import express from 'express';
import {
  getRecommendations,
  getTrending,
  analyseReview,
  batchAnalyseReviews,
  chat,
  getChatbotResponses,
  upsertChatbotResponse,
  deleteChatbotResponse,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public / customer
router.get('/recommendations', protect, getRecommendations);
router.post('/chat', chat);

// Admin
router.get('/trending',          protect, adminOnly, getTrending);
router.post('/analyse-review',   protect, adminOnly, analyseReview);
router.get('/analyse-reviews',   protect, adminOnly, batchAnalyseReviews);
router.get('/chatbot-responses',    protect, adminOnly, getChatbotResponses);
router.post('/chatbot-responses',   protect, adminOnly, upsertChatbotResponse);
router.delete('/chatbot-responses/:id', protect, adminOnly, deleteChatbotResponse);

export default router;
