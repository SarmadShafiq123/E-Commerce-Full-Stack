/**
 * Chatbot Intent Recognition — pure JS, zero dependencies.
 * Keyword-weighted scoring with TF-style matching.
 */

export const INTENTS = {
  SHIPPING:     'shipping',
  RETURNS:      'returns',
  STOCK:        'stock',
  PAYMENT:      'payment',
  ORDER_STATUS: 'order_status',
  DISCOUNT:     'discount',
  CONTACT:      'contact',
  GREETING:     'greeting',
  GOODBYE:      'goodbye',
  UNKNOWN:      'unknown',
};

// Weighted keyword map — higher weight = stronger signal
const INTENT_KEYWORDS = {
  [INTENTS.SHIPPING]:     { ship:2, shipping:2, deliver:2, delivery:2, courier:2, track:1, tracking:2, dispatch:1, arrive:1, arrival:1, days:1, when:1, how_long:2 },
  [INTENTS.RETURNS]:      { return:2, refund:2, exchange:2, replace:2, replacement:2, policy:1, back:1, money:1, cancel:2 },
  [INTENTS.STOCK]:        { stock:2, available:2, availability:2, quantity:1, left:1, have:1, 'out of stock':2, 'in stock':2 },
  [INTENTS.PAYMENT]:      { pay:2, payment:2, cod:2, cash:1, bank:1, transfer:1, easypaisa:2, jazzcash:2, method:1 },
  [INTENTS.ORDER_STATUS]: { order:1, status:2, where:1, processing:1, shipped:1, delivered:1, update:1, 'my order':2, placed:1 },
  [INTENTS.DISCOUNT]:     { discount:2, coupon:2, code:1, promo:2, offer:1, sale:1, deal:1, off:1, percent:1 },
  [INTENTS.CONTACT]:      { contact:2, help:1, support:2, human:2, agent:2, talk:1, call:1, email:1, reach:1 },
  [INTENTS.GREETING]:     { hi:2, hello:2, hey:2, morning:1, afternoon:1, evening:1, salaam:2, salam:2, howdy:1 },
  [INTENTS.GOODBYE]:      { bye:2, goodbye:2, thanks:1, thank:1, later:1, done:1, ok:1 },
};

export const DEFAULT_RESPONSES = {
  [INTENTS.SHIPPING]:     'We deliver across Pakistan via Leopards, TCS, and Trax. Standard delivery takes 3–5 business days. You\'ll receive a tracking number once your order ships.',
  [INTENTS.RETURNS]:      'We accept returns within 7 days of delivery for unused items in original packaging. Contact us with your order ID to initiate a return.',
  [INTENTS.STOCK]:        'You can check real-time stock on each product page. If an item shows "Out of Stock", save it to your wishlist and we\'ll notify you when it\'s back.',
  [INTENTS.PAYMENT]:      'We accept Cash on Delivery (COD), Bank Transfer, Easypaisa, and JazzCash. Payment details are shown at checkout.',
  [INTENTS.ORDER_STATUS]: 'Track your order in My Orders → Order Details. You\'ll also receive email and WhatsApp updates when your order ships.',
  [INTENTS.DISCOUNT]:     'We regularly offer discount codes. Check our homepage for current promotions, or enter a coupon code at checkout.',
  [INTENTS.CONTACT]:      'Reach our team via WhatsApp (button on any product page) or email us at support@luxebags.store.',
  [INTENTS.GREETING]:     'Hello! Welcome to Luxe Bags 👜 How can I help you today? I can answer questions about shipping, returns, payments, and more.',
  [INTENTS.GOODBYE]:      'Thank you for visiting Luxe Bags! If you need anything else, don\'t hesitate to ask. Have a wonderful day ✨',
  [INTENTS.UNKNOWN]:      'I\'m not sure I understood that. I can help with shipping, returns, payments, order status, and stock. Could you rephrase?',
};

// ── Scoring ───────────────────────────────────────────────────────────────────

const scoreIntent = (text, keywords) => {
  const lower = text.toLowerCase();
  let score = 0;
  for (const [kw, weight] of Object.entries(keywords)) {
    if (lower.includes(kw.replace(/_/g, ' '))) score += weight;
  }
  return score;
};

/**
 * @param {string} message
 * @param {object} customResponses — admin overrides from DB
 * @returns {{ intent: string, confidence: number, response: string }}
 */
export const processMessage = (message = '', customResponses = {}) => {
  const scores = {};
  let maxScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    scores[intent] = scoreIntent(message, keywords);
    if (scores[intent] > maxScore) maxScore = scores[intent];
  }

  const topIntent = maxScore > 0
    ? Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
    : INTENTS.UNKNOWN;

  // Confidence: ratio of top score to max possible (sum of all weights)
  const maxPossible = Math.max(...Object.values(INTENT_KEYWORDS).map((kws) =>
    Object.values(kws).reduce((s, w) => s + w, 0)
  ));
  const confidence = Math.round((maxScore / maxPossible) * 100);

  const responses = { ...DEFAULT_RESPONSES, ...customResponses };
  const response  = responses[topIntent] || responses[INTENTS.UNKNOWN];

  return { intent: topIntent, confidence, response };
};
