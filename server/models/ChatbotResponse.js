import mongoose from 'mongoose';

const chatbotResponseSchema = new mongoose.Schema(
  {
    intent:   { type: String, required: true, unique: true },
    response: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ChatbotResponse = mongoose.model('ChatbotResponse', chatbotResponseSchema);
export default ChatbotResponse;
