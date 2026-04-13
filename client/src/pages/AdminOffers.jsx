import { useState, useEffect } from 'react';
import { productAPI, adminAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import AdminSidebar from '../components/AdminSidebar';

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">{label}</label>
    <input {...props} className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300" />
  </div>
);

const isOfferActive = (p) => {
  if (!p.offerPrice || !p.offerStart || !p.offerEnd) return false;
  const now = new Date();
  return now >= new Date(p.offerStart) && now <= new Date(p.offerEnd);
};

const AdminOffers = () => {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm]           = useState({ offerPrice: '', offerStart: '', offerEnd: '' });
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: '' }), 3000); };

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getAllProductsAdmin({ page, limit: 12 });
      setProducts(data.data);
      setPages(data.pages);
    } catch { showToast('Failed to load products', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page]);

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      offerPrice: p.offerPrice || '',
      offerStart: p.offerStart ? p.offerStart.slice(0, 16) : '',
      offerEnd:   p.offerEnd   ? p.offerEnd.slice(0, 16)   : '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await adminAPI.updateOffer(editProduct._id, {
        offerPrice: form.offerPrice ? parseFloat(form.offerPrice) : null,
        offerStart: form.offerStart || null,
        offerEnd:   form.offerEnd   || null,
      });
      showToast('Offer saved');
      setEditProduct(null);
      fetch();
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleClear = async (id) => {
    try { await adminAPI.updateOffer(id, { clearOffer: true }); showToast('Offer cleared'); fetch(); }
    catch { showToast('Failed to clear offer', 'error'); }
  };

  const discount = (p) => p.offerPrice ? Math.round(((p.price - p.offerPrice) / p.price) * 100) : 0;

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0">
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Admin</p>
              <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Offers & Flash Sales</h1>
            </div>

            {toast.msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-xs ${toast.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{toast.msg}</div>
            )}

            {loading ? <Spinner /> : (
              <>
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#EAEAEA]">
                          {['Product', 'Regular Price', 'Offer Price', 'Discount', 'Period', 'Status', ''].map((h) => (
                            <th key={h} className="text-left text-[10px] tracking-widest uppercase text-[#6B7280] px-4 py-3 font-normal whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {products.map((p) => {
                          const active = isOfferActive(p);
                          const hasOffer = !!p.offerPrice;
                          return (
                            <tr key={p._id} className={`hover:bg-[#FAFAFA] transition duration-300 ${active ? 'bg-amber-50/30' : ''}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img src={p.images?.[0]?.url || '/placeholder.jpg'} alt={p.name} loading="lazy" className="w-9 h-11 object-cover rounded-lg shrink-0" />
                                  <span className="text-sm text-[#1A1A1A] max-w-[140px] truncate">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-[#1A1A1A]">{formatPrice(p.price)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-amber-600">
                                {hasOffer ? formatPrice(p.offerPrice) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                {hasOffer ? (
                                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    -{discount(p)}%
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 text-xs text-[#6B7280]">
                                {p.offerStart && p.offerEnd ? (
                                  <span>
                                    {new Date(p.offerStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {' → '}
                                    {new Date(p.offerEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                {hasOffer ? (
                                  <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full ${active ? 'bg-amber-50 text-amber-600' : 'bg-[#F5F5F5] text-[#6B7280]'}`}>
                                    {active ? 'Live' : 'Scheduled'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-[#F5F5F5] text-[#6B7280]">No Offer</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <button onClick={() => openEdit(p)} className="text-xs text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
                                    {hasOffer ? 'Edit' : 'Set Offer'}
                                  </button>
                                  {hasOffer && (
                                    <button onClick={() => handleClear(p._id)} className="text-xs text-[#6B7280] hover:text-red-400 transition duration-300">Clear</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                      <button key={n} onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-full text-sm transition duration-300 ${page === n ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A]'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Set Offer / Flash Sale">
        {editProduct && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-xl">
              <img src={editProduct.images?.[0]?.url} alt={editProduct.name} className="w-10 h-12 object-cover rounded-lg shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">{editProduct.name}</p>
                <p className="text-xs text-[#6B7280]">Regular: {formatPrice(editProduct.price)}</p>
              </div>
            </div>

            <InputField label="Offer Price (Rs.)" type="number" min="0" max={editProduct.price - 1} step="0.01" value={form.offerPrice} onChange={(e) => setForm({ ...form, offerPrice: e.target.value })} placeholder="e.g. 1999" required />

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Start Date & Time" type="datetime-local" value={form.offerStart} onChange={(e) => setForm({ ...form, offerStart: e.target.value })} required />
              <InputField label="End Date & Time"   type="datetime-local" value={form.offerEnd}   onChange={(e) => setForm({ ...form, offerEnd: e.target.value })}   required />
            </div>

            {form.offerPrice && editProduct.price && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                Discount: {Math.round(((editProduct.price - parseFloat(form.offerPrice)) / editProduct.price) * 100)}% off
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Offer'}
              </button>
              <button type="button" onClick={() => setEditProduct(null)} className="flex-1 py-3 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:bg-[#FAFAFA] transition duration-300">
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminOffers;
