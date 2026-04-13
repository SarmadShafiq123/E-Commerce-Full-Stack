import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Spinner from '../components/Spinner';
import AdminSidebar from '../components/AdminSidebar';

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map((s) => (
      <svg key={s} xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${s <= rating ? 'text-amber-400' : 'text-[#EAEAEA]'}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const statusColors = {
  pending:  'bg-amber-50 text-amber-600',
  approved: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-400',
};

const AdminReviews = () => {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');
  const [toast, setToast]       = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: '' }), 3000); };

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAllReviews(filter ? { status: filter } : {});
      setReviews(data.data);
    } catch { showToast('Failed to load reviews', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'delete') {
        if (!window.confirm('Delete this review?')) return;
        await adminAPI.deleteReview(id);
        showToast('Review deleted');
      } else if (action === 'approve') {
        await adminAPI.updateReview(id, { status: 'approved' });
        showToast('Review approved');
      } else if (action === 'reject') {
        await adminAPI.updateReview(id, { status: 'rejected' });
        showToast('Review rejected');
      } else if (action === 'feature') {
        const r = reviews.find((r) => r._id === id);
        await adminAPI.updateReview(id, { isFeatured: !r.isFeatured });
        showToast(r.isFeatured ? 'Unfeatured' : 'Featured');
      }
      fetch();
    } catch { showToast('Action failed', 'error'); }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Admin</p>
                <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Reviews</h1>
              </div>
              <div className="flex gap-2">
                {['pending', 'approved', 'rejected', ''].map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-4 py-2 rounded-full text-xs tracking-wide transition duration-300 ${filter === s ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A]'}`}>
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {toast.msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-xs ${toast.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{toast.msg}</div>
            )}

            {loading ? <Spinner /> : reviews.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <p className="text-sm text-[#6B7280]">No reviews found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r._id} className="bg-white rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center text-sm font-medium text-[#1A1A1A] shrink-0">
                          {r.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{r.user?.name}</p>
                          <p className="text-xs text-[#6B7280]">{r.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Stars rating={r.rating} />
                        <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full ${statusColors[r.status]}`}>
                          {r.status}
                        </span>
                        {r.isFeatured && (
                          <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">Featured</span>
                        )}
                      </div>
                    </div>

                    {/* Product */}
                    {r.product && (
                      <div className="flex items-center gap-2 mb-3 p-2.5 bg-[#FAFAFA] rounded-xl">
                        <img src={r.product.images?.[0]?.url} alt={r.product.name} loading="lazy" className="w-8 h-10 object-cover rounded-lg shrink-0" />
                        <p className="text-xs text-[#6B7280] truncate">{r.product.name}</p>
                      </div>
                    )}

                    {r.title && <p className="text-sm font-medium text-[#1A1A1A] mb-1">{r.title}</p>}
                    {r.body  && <p className="text-sm text-[#6B7280] leading-relaxed mb-3">{r.body}</p>}

                    <p className="text-[10px] text-[#9CA3AF] mb-3">
                      {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap border-t border-[#EAEAEA] pt-3">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(r._id, 'approve')} className="text-xs tracking-widest uppercase text-green-600 hover:opacity-70 transition duration-300">Approve</button>
                          <button onClick={() => handleAction(r._id, 'reject')}  className="text-xs tracking-widest uppercase text-red-400 hover:opacity-70 transition duration-300">Reject</button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button onClick={() => handleAction(r._id, 'feature')} className="text-xs tracking-widest uppercase text-purple-600 hover:opacity-70 transition duration-300">
                          {r.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                      )}
                      <button onClick={() => handleAction(r._id, 'delete')} className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-red-400 transition duration-300 ml-auto">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
