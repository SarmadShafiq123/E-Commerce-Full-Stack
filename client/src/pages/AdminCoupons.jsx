import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import AdminSidebar from '../components/AdminSidebar';

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">{label}</label>
    <input {...props} className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300" />
  </div>
);

const empty = { code: '', discountType: 'percentage', discountValue: '', minOrderValue: '', usageLimit: '', expiryDate: '', isActive: true };

const AdminCoupons = () => {
  const [coupons, setCoupons]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(empty);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: '' }), 3000); };

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await adminAPI.getCoupons(); setCoupons(data.data); }
    catch { showToast('Failed to load coupons', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit   = (c) => {
    setEditing(c);
    setForm({
      code: c.code, discountType: c.discountType, discountValue: c.discountValue,
      minOrderValue: c.minOrderValue || '', usageLimit: c.usageLimit || '',
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: parseFloat(form.discountValue),
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : 0,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        expiryDate: form.expiryDate || null,
      };
      if (editing) await adminAPI.updateCoupon(editing._id, payload);
      else await adminAPI.createCoupon(payload);
      showToast(editing ? 'Coupon updated' : 'Coupon created');
      setShowModal(false);
      fetch();
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await adminAPI.deleteCoupon(id); showToast('Coupon deleted'); fetch(); }
    catch { showToast('Delete failed', 'error'); }
  };

  const handleToggle = async (c) => {
    try { await adminAPI.updateCoupon(c._id, { isActive: !c.isActive }); fetch(); }
    catch { showToast('Toggle failed', 'error'); }
  };

  const isExpired = (c) => c.expiryDate && new Date() > new Date(c.expiryDate);
  const isExhausted = (c) => c.usageLimit !== null && c.usedCount >= c.usageLimit;

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Admin</p>
                <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Coupons</h1>
              </div>
              <button onClick={openCreate} className="flex items-center gap-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase px-5 py-2.5 rounded-full hover:opacity-80 transition duration-300">
                + New Coupon
              </button>
            </div>

            {toast.msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-xs ${toast.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{toast.msg}</div>
            )}

            {loading ? <Spinner /> : coupons.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <p className="text-sm text-[#6B7280]">No coupons yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#EAEAEA]">
                        {['Code', 'Discount', 'Min Order', 'Usage', 'Expiry', 'Status', ''].map((h) => (
                          <th key={h} className="text-left text-[10px] tracking-widest uppercase text-[#6B7280] px-4 py-3 font-normal whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {coupons.map((c) => {
                        const expired   = isExpired(c);
                        const exhausted = isExhausted(c);
                        const valid     = c.isActive && !expired && !exhausted;
                        return (
                          <tr key={c._id} className="hover:bg-[#FAFAFA] transition duration-300">
                            <td className="px-4 py-3 font-mono text-sm text-[#1A1A1A] font-medium">{c.code}</td>
                            <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                              {c.discountType === 'percentage' ? `${c.discountValue}%` : `Rs. ${c.discountValue}`}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#6B7280]">
                              {c.minOrderValue > 0 ? `Rs. ${c.minOrderValue}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#6B7280]">
                              {c.usageLimit ? `${c.usedCount}/${c.usageLimit}` : `${c.usedCount}/∞`}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#6B7280]">
                              {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full ${
                                expired || exhausted ? 'bg-red-50 text-red-400' :
                                valid ? 'bg-green-50 text-green-600' : 'bg-[#F5F5F5] text-[#6B7280]'
                              }`}>
                                {expired ? 'Expired' : exhausted ? 'Exhausted' : valid ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button onClick={() => openEdit(c)} className="text-xs text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">Edit</button>
                                <button onClick={() => handleToggle(c)} className="text-xs text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
                                  {c.isActive ? 'Disable' : 'Enable'}
                                </button>
                                <button onClick={() => handleDelete(c._id)} className="text-xs text-[#6B7280] hover:text-red-400 transition duration-300">Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Coupon' : 'New Coupon'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Coupon Code" type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="e.g. LUXE20" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (Rs.)</option>
              </select>
            </div>
            <InputField label={form.discountType === 'percentage' ? 'Discount %' : 'Discount Rs.'} type="number" min="0" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required placeholder="0" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Min Order Value (Rs.)" type="number" min="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} placeholder="0" />
            <InputField label="Usage Limit" type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
          </div>

          <InputField label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            <span className="text-sm text-[#1A1A1A]">Active</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:bg-[#FAFAFA] transition duration-300">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCoupons;
