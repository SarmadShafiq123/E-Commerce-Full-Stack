/**
 * Sentiment Analysis — pure JS, zero dependencies.
 * Lexicon-based scoring with spam detection.
 */

const POSITIVE = new Set([
  'love','amazing','excellent','perfect','beautiful','gorgeous','stunning',
  'fantastic','wonderful','great','good','nice','quality','premium','luxury',
  'elegant','stylish','recommend','happy','satisfied','best','superb','lovely',
  'impressive','outstanding','brilliant','fabulous','delightful','pleased',
  'smooth','soft','durable','authentic','genuine','worth','value','fast',
]);

const NEGATIVE = new Set([
  'bad','terrible','awful','horrible','poor','cheap','fake','disappointed',
  'waste','broken','defective','ugly','worst','hate','useless','damaged',
  'wrong','missing','late','slow','rude','scam','fraud','return','refund',
  'never','not','no','dont','doesnt','didnt','wont','cant','couldnt',
  'stitch','peeling','smell','smells','cracked','torn','faded',
]);

const SPAM_PATTERNS = [
  /(.)\1{4,}/,
  /https?:\/\//i,
  /\b(buy now|click here|free gift|win prize|limited offer|visit our)\b/i,
  /[A-Z]{6,}/,
  /\d{10,}/,
];

const INTENSIFIERS = new Set(['very','really','so','extremely','absolutely','totally','completely']);

/**
 * @param {string} text
 * @returns {{ sentiment: 'positive'|'neutral'|'negative', score: number, isSpam: boolean }}
 */
export const analyzeSentiment = (text = '') => {
  const isSpam = SPAM_PATTERNS.some((p) => p.test(text));

  const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  let score = 0;
  let intensify = 1;

  for (const word of words) {
    if (INTENSIFIERS.has(word)) { intensify = 1.5; continue; }
    if (POSITIVE.has(word)) { score += 1 * intensify; intensify = 1; }
    else if (NEGATIVE.has(word)) { score -= 1 * intensify; intensify = 1; }
    else { intensify = 1; }
  }

  // Normalise to [-1, 1]
  const norm = words.length > 0 ? score / Math.sqrt(words.length) : 0;

  let sentiment;
  if (norm > 0.15)       sentiment = 'positive';
  else if (norm < -0.15) sentiment = 'negative';
  else                   sentiment = 'neutral';

  // Confidence scores (sum to ~1)
  const pos = Math.max(0, Math.min(1, 0.5 + norm));
  const neg = Math.max(0, Math.min(1, 0.5 - norm));
  const neu = Math.max(0, 1 - pos - neg);

  return {
    sentiment,
    score: Math.round(norm * 100) / 100,
    isSpam,
    scores: {
      positive: Math.round(pos * 100) / 100,
      neutral:  Math.round(neu * 100) / 100,
      negative: Math.round(neg * 100) / 100,
    },
  };
};
