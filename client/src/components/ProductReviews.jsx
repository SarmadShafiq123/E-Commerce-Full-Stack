import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewAPI, orderAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Stars = ({ rating, interactive = false, onRate }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map((s) => (
      <button
        key={s}
        type={interactive ? 'button' : undefined}
        onClick={interactive ? () => onRate(s) : undefined}
        className={interactive ? 'cursor-pointer' : 'cursor-default'}
        aria-label={interactive ? `Rate ${s} stars` : undefined}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`${interactive ? 'w-5 h-5' : 'w-3.5 h-3.5'} ${s <= rating ? 'text-amber-400' : 'text-[#EAEAEA]'} transition duration-150`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
    ))}
  </div>
);

const ProductReviews = ({ productId }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [reviews, setReviews]       = useState([]);
  const [meta, setMeta]             = useState({ total: 0, avgRating: 0 });
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [eligibleOrder, setEligibleOrder] = useState(null);
  const [form, setForm]             = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    reviewAPI.getProductReviews(productId)
      .then(({ data }) => { setReviews(data.data); setMeta(data.meta); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId, submitted]);

  // Check if user has a delivered order with this product
  useEffect(() => {
    if (!user) return;
    orderAPI.getMyOrders()
      .then(({ data }) => {
        const order = data.data.find((o) =>
          o.orderStatus === 'delivered' &&
          o.items.some((i) => i.product === productId || i.product?._id === productId)
        );
        setEligibleOrder(order || null);
      })
      .catch(() => {});
  }, [user, productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eligibleOrder) return;
    setSubmitting(true); setError('');
    try {
      await reviewAPI.submitReview({ productId, orderId: eligibleOrder._id, ...form });
      setSubmitted(true);
      setShowForm(false);
      setForm({ rating: 5, title: '', body: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const ratingDist = [5,4,3,2,1].map((r) => ({
    r,
    count: reviews.filter((rv) => rv.rating === r).length,
    pct: reviews.length ? Math.round((reviews.filter((rv) => rv.rating === r).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="mt-12 pt-10 border-t border-[#EAEAEA]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Customer Reviews</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-light text-[#1A1A1A]">{meta.avgRating || '—'}</span>
            {meta.avgRating > 0 && <Stars rating={Math.round(meta.avgRating)} />}
            <span className="text-sm text-[#6B7280]">{meta.total} {meta.total === 1 ? 'review' : 'reviews'}</span>
          </div>
        </div>

        {user && eligibleOrder && !submitted && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-5 py-2.5 border border-[#EAEAEA] text-xs tracking-widest uppercase text-[#1A1A1A] rounded-full hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition duration-300"
          >
            Write a Review
          </button>
        )}
        {!user && (
          <button onClick={() => navigate('/login')} className="text-xs text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
            Sign in to review
          </button>
        )}
      </div>

      {/* Rating distribution */}
      {meta.total > 0 && (
        <div className="space-y-1.5 mb-8 max-w-xs">
          {ratingDist.map(({ r, count, pct }) => (
            <div key={r} className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280] w-3">{r}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition duration-300" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] text-[#6B7280] w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#FAFAFA] rounded-2xl p-5 mb-8 space-y-4">
          <p className="text-xs tracking-widest uppercase text-[#1A1A1A]">Your Review</p>
          <div>
            <p className="text-xs text-[#6B7280] mb-2">Rating</p>
            <Stars rating={form.rating} interactive onRate={(r) => setForm({ ...form, rating: r })} />
          </div>
          <div>
            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Title (optional)</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100}
              className="w-full px-4 py-2.5 bg-white border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
              placeholder="Summarise your experience" />
          </div>
          <div>
            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Review</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} maxLength={1000}
              className="w-full px-4 py-2.5 bg-white border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300 resize-none"
              placeholder="Share your thoughts about this product..." />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:bg-[#FAFAFA] transition duration-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-8 text-xs text-green-600">
          Thank you! Your review has been submitted for approval.
        </div>
      )}

      {/* Reviews list */}
      {loading ? null : reviews.length === 0 ? (
        <p className="text-sm text-[#6B7280] py-8 text-center">No reviews yet. Be the first to review this product.</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r._id} className={`bg-white rounded-2xl p-5 ${r.isFeatured ? 'border border-amber-100' : ''}`}>
              {r.isFeatured && (
                <span className="text-[9px] tracking-widest uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mb-3 inline-block">Featured Review</span>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-xs font-medium text-[#1A1A1A]">
                    {r.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-[#1A1A1A]">{r.user?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-[10px] text-[#9CA3AF]">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              {r.title && <p className="text-sm font-medium text-[#1A1A1A] mb-1">{r.title}</p>}
              {r.body  && <p className="text-sm text-[#6B7280] leading-relaxed">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
