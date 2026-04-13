import { useState, useEffect } from 'react';
import { aiAPI, adminAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/Spinner';
import AdminSidebar from '../components/AdminSidebar';

// ── Sentiment badge ───────────────────────────────────────────────────────────
const SentimentBadge = ({ sentiment }) => {
  const map = {
    positive: 'bg-green-50 text-green-600',
    neutral:  'bg-[#F5F5F5] text-[#6B7280]',
    negative: 'bg-red-50 text-red-500',
  };
  const icons = { positive: '😊', neutral: '😐', negative: '😞' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full ${map[sentiment] || map.neutral}`}>
      {icons[sentiment]} {sentiment}
    </span>
  );
};

// ── Trending bar ──────────────────────────────────────────────────────────────
const TrendBar = ({ value, max }) => (
  <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
    <div className="h-full bg-[#1A1A1A] rounded-full transition duration-300" style={{ width: `${(value / Math.max(max, 1)) * 100}%` }} />
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const AdminAI = () => {
  const [trending, setTrending]         = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [reviews, setReviews]           = useState([]);
  const [trendDays, setTrendDays]       = useState(7);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [toast, setToast]               = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Trending
  useEffect(() => {
    setLoadingTrend(true);
    aiAPI.getTrending({ days: trendDays, limit: 8 })
      .then(({ data }) => setTrending(data.data))
      .catch(console.error)
      .finally(() => setLoadingTrend(false));
  }, [trendDays]);

  // Load pending reviews for sentiment analysis
  useEffect(() => {
    adminAPI.getAllReviews({ status: 'pending' })
      .then(({ data }) => setReviews(data.data))
      .catch(console.error);
  }, []);

  const runSentimentAnalysis = async () => {
    setLoadingSentiment(true);
    try {
      const { data } = await aiAPI.batchAnalyseReviews();
      setSentimentData(data.data);
    } catch { showToast('Analysis failed'); }
    finally { setLoadingSentiment(false); }
  };

  const handleApprove = async (reviewId) => {
    try {
      await adminAPI.updateReview(reviewId, { status: 'approved' });
      setSentimentData((prev) => prev.filter((r) => r._id !== reviewId));
      showToast('Review approved');
    } catch { showToast('Failed'); }
  };

  const handleReject = async (reviewId) => {
    try {
      await adminAPI.updateReview(reviewId, { status: 'rejected' });
      setSentimentData((prev) => prev.filter((r) => r._id !== reviewId));
      showToast('Review rejected');
    } catch { showToast('Failed'); }
  };

  const maxUnits = trending[0]?.unitsSold || 1;

  // Sentiment summary from analysed data
  const sentimentSummary = sentimentData.reduce((acc, r) => {
    acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0 space-y-6">

            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">AI Intelligence</p>
              <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">AI Analytics</h1>
            </div>

            {toast && (
              <div className="px-4 py-3 bg-green-50 text-green-600 text-xs rounded-xl">{toast}</div>
            )}

            {/* ── Trending Products ── */}
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-0.5">AI Trend Analysis</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">Trending Products</p>
                </div>
                <div className="flex gap-2">
                  {[7, 14, 30].map((d) => (
                    <button key={d} onClick={() => setTrendDays(d)}
                      className={`px-3 py-1.5 rounded-full text-xs transition duration-300 ${trendDays === d ? 'bg-[#1A1A1A] text-white' : 'border border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A]'}`}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {loadingTrend ? <Spinner size="sm" /> : trending.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-6">No sales data in this period</p>
              ) : (
                <div className="space-y-3">
                  {trending.map((p, i) => (
                    <div key={p._id} className="flex items-center gap-3">
                      <span className="text-[10px] text-[#6B7280] w-4 shrink-0 font-medium">{i + 1}</span>
                      {p.image && (
                        <img src={p.image} alt={p.name} loading="lazy" className="w-9 h-11 object-cover rounded-lg shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#1A1A1A] truncate font-medium">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <TrendBar value={p.unitsSold} max={maxUnits} />
                          <span className="text-[10px] text-[#6B7280] shrink-0">{p.unitsSold} sold</span>
                        </div>
                      </div>
                      <span className="text-xs text-[#1A1A1A] shrink-0">{formatPrice(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Sentiment Analysis ── */}
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-0.5">AI Moderation</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">Review Sentiment Analysis</p>
                </div>
                <button
                  onClick={runSentimentAnalysis}
                  disabled={loadingSentiment || reviews.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-40"
                >
                  {loadingSentiment ? (
                    <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Analysing...</>
                  ) : (
                    <>✦ Analyse {reviews.length} Pending</>
                  )}
                </button>
              </div>

              {/* Summary pills */}
              {sentimentData.length > 0 && (
                <div className="flex gap-3 mb-5 flex-wrap">
                  {[['positive', 'bg-green-50 text-green-600'], ['neutral', 'bg-[#F5F5F5] text-[#6B7280]'], ['negative', 'bg-red-50 text-red-500']].map(([s, cls]) => (
                    <div key={s} className={`px-3 py-1.5 rounded-full text-xs ${cls}`}>
                      {s}: {sentimentSummary[s] || 0}
                    </div>
                  ))}
                  {sentimentData.filter((r) => r.isSpam).length > 0 && (
                    <div className="px-3 py-1.5 rounded-full text-xs bg-amber-50 text-amber-600">
                      Spam flagged: {sentimentData.filter((r) => r.isSpam).length}
                    </div>
                  )}
                </div>
              )}

              {sentimentData.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-6">
                  {reviews.length === 0 ? 'No pending reviews to analyse' : 'Click "Analyse" to run AI sentiment analysis on pending reviews'}
                </p>
              ) : (
                <div className="space-y-3">
                  {sentimentData.map((r) => {
                    const review = reviews.find((rv) => rv._id === r._id);
                    return (
                      <div key={r._id} className={`p-4 rounded-xl border ${r.isSpam ? 'border-amber-200 bg-amber-50/30' : 'border-[#EAEAEA]'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SentimentBadge sentiment={r.sentiment} />
                            {r.isSpam && (
                              <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                                ⚠ Spam
                              </span>
                            )}
                            <span className="text-[10px] text-[#9CA3AF]">
                              {Math.round((r.scores[r.sentiment] || 0) * 100)}% confidence
                            </span>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleApprove(r._id)}
                              className="text-xs tracking-widest uppercase text-green-600 hover:opacity-70 transition duration-300">
                              Approve
                            </button>
                            <button onClick={() => handleReject(r._id)}
                              className="text-xs tracking-widest uppercase text-red-400 hover:opacity-70 transition duration-300">
                              Reject
                            </button>
                          </div>
                        </div>
                        {review && (
                          <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                            {review.title ? `"${review.title}" — ` : ''}{review.body}
                          </p>
                        )}
                        {/* Score bars */}
                        <div className="mt-2 space-y-1">
                          {Object.entries(r.scores).map(([s, v]) => (
                            <div key={s} className="flex items-center gap-2">
                              <span className="text-[9px] text-[#9CA3AF] w-14 capitalize">{s}</span>
                              <div className="flex-1 h-1 bg-[#F5F5F5] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition duration-300"
                                  style={{ width: `${v * 100}%`, backgroundColor: s === 'positive' ? '#10B981' : s === 'negative' ? '#EF4444' : '#9CA3AF' }} />
                              </div>
                              <span className="text-[9px] text-[#9CA3AF] w-8 text-right">{Math.round(v * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminAI;
