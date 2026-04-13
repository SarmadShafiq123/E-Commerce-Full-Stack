import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/Spinner';
import AdminSidebar from '../components/AdminSidebar';
import StockUpdateModal from '../components/StockUpdateModal';

// ── helpers ──────────────────────────────────────────────────────────────────

const StockBadge = ({ stock, threshold }) => {
  if (stock === 0)
    return <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-red-50 text-red-500">Out of Stock</span>;
  if (stock <= threshold)
    return <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Low Stock</span>;
  return <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-green-50 text-green-600">In Stock</span>;
};

const StatCard = ({ label, value, sub, accent }) => (
  <div className={`bg-white rounded-2xl p-5 border-l-4 ${accent}`}>
    <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-2">{label}</p>
    <p className="text-3xl font-light text-[#1A1A1A]">{value}</p>
    {sub && <p className="text-xs text-[#6B7280] mt-1">{sub}</p>}
  </div>
);

// ── main ─────────────────────────────────────────────────────────────────────

const AdminInventory = () => {
  const [products, setProducts]       = useState([]);
  const [meta, setMeta]               = useState({ total: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all'); // all | low | out | inactive
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(new Set());
  const [editProduct, setEditProduct] = useState(null);
  const [bulkStock, setBulkStock]     = useState('');
  const [bulkSaving, setBulkSaving]   = useState(false);
  const [toast, setToast]             = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'low') params.lowStock = 'true';
      if (search.trim()) params.search = search.trim();
      const { data } = await adminAPI.getInventory(params);
      let list = data.data;
      if (filter === 'out')      list = list.filter((p) => p.stock === 0);
      if (filter === 'inactive') list = list.filter((p) => !p.isActive);
      setProducts(list);
      setMeta(data.meta);
    } catch { showToast('Failed to load inventory', 'error'); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // ── selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p._id)));
  };

  // ── single stock update ────────────────────────────────────────────────────
  const handleStockSave = async (id, payload) => {
    await adminAPI.updateStock(id, payload);
    showToast('Stock updated');
    await fetchInventory();
  };

  // ── toggle active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (id) => {
    try {
      const { data } = await adminAPI.toggleActive(id);
      setProducts((prev) =>
        prev.map((p) => p._id === id ? { ...p, isActive: data.data.isActive } : p)
      );
      showToast(data.message);
    } catch { showToast('Toggle failed', 'error'); }
  };

  // ── bulk stock update ──────────────────────────────────────────────────────
  const handleBulkUpdate = async () => {
    if (!bulkStock.trim() || selected.size === 0) return;
    const val = parseInt(bulkStock);
    if (isNaN(val) || val < 0) { showToast('Enter a valid stock number', 'error'); return; }
    setBulkSaving(true);
    try {
      const updates = [...selected].map((id) => ({ id, stock: val }));
      await adminAPI.bulkUpdateInventory(updates);
      showToast(`Updated ${selected.size} product(s)`);
      setSelected(new Set());
      setBulkStock('');
      await fetchInventory();
    } catch { showToast('Bulk update failed', 'error'); }
    finally { setBulkSaving(false); }
  };

  // ── bulk toggle active ─────────────────────────────────────────────────────
  const handleBulkToggle = async (isActive) => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    try {
      const updates = [...selected].map((id) => ({ id, isActive }));
      await adminAPI.bulkUpdateInventory(updates);
      showToast(`${isActive ? 'Activated' : 'Deactivated'} ${selected.size} product(s)`);
      setSelected(new Set());
      await fetchInventory();
    } catch { showToast('Bulk action failed', 'error'); }
    finally { setBulkSaving(false); }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />

          <main className="flex-1 min-w-0 space-y-6">

            {/* Header */}
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Admin</p>
              <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Inventory</h1>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Products" value={meta.total} accent="border-[#EAEAEA]" />
              <StatCard label="In Stock" value={meta.total - meta.lowStockCount - meta.outOfStockCount} sub="above threshold" accent="border-green-300" />
              <StatCard label="Low Stock" value={meta.lowStockCount} sub="at or below threshold" accent="border-amber-300" />
              <StatCard label="Out of Stock" value={meta.outOfStockCount} sub="zero units" accent="border-red-300" />
            </div>

            {/* Filters + search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAEAEA] rounded-full text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all',      label: 'All' },
                  { key: 'low',      label: 'Low Stock' },
                  { key: 'out',      label: 'Out of Stock' },
                  { key: 'inactive', label: 'Inactive' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-4 py-2.5 rounded-full text-xs tracking-wide transition duration-300 ${
                      filter === f.key
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white border border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 bg-[#1A1A1A] rounded-2xl">
                <span className="text-xs text-white/70 shrink-0">{selected.size} selected</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Set stock to..."
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    className="w-36 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition duration-300"
                  />
                  <button
                    onClick={handleBulkUpdate}
                    disabled={bulkSaving || !bulkStock.trim()}
                    className="px-4 py-2 bg-white text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-40 shrink-0"
                  >
                    {bulkSaving ? '...' : 'Apply'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkToggle(true)}
                    disabled={bulkSaving}
                    className="px-3 py-2 bg-green-500/20 text-green-300 text-xs tracking-wide rounded-full hover:bg-green-500/30 transition duration-300 disabled:opacity-40"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkToggle(false)}
                    disabled={bulkSaving}
                    className="px-3 py-2 bg-red-500/20 text-red-300 text-xs tracking-wide rounded-full hover:bg-red-500/30 transition duration-300 disabled:opacity-40"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="px-3 py-2 text-white/50 text-xs hover:text-white transition duration-300"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Toast */}
            {toast.msg && (
              <div className={`px-4 py-3 rounded-xl text-xs ${toast.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                {toast.msg}
              </div>
            )}

            {/* Table */}
            {loading ? <Spinner /> : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <p className="text-sm text-[#6B7280]">No products match this filter</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#EAEAEA]">
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selected.size === products.length && products.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded cursor-pointer"
                          />
                        </th>
                        {['Product', 'Category', 'Price', 'Stock', 'Threshold', 'Status', 'Active', ''].map((h) => (
                          <th key={h} className="text-left text-[10px] tracking-widest uppercase text-[#6B7280] px-4 py-3 font-normal whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {products.map((product) => {
                        const isLow  = product.stock > 0 && product.stock <= product.lowStockThreshold;
                        const isOut  = product.stock === 0;
                        const rowBg  = isOut ? 'bg-red-50/40' : isLow ? 'bg-amber-50/40' : '';

                        return (
                          <tr key={product._id} className={`hover:bg-[#FAFAFA] transition duration-300 ${rowBg}`}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selected.has(product._id)}
                                onChange={() => toggleSelect(product._id)}
                                className="rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.images?.[0]?.url || '/placeholder.jpg'}
                                  alt={product.name}
                                  loading="lazy"
                                  className="w-9 h-11 object-cover rounded-lg shrink-0"
                                />
                                <span className="text-sm text-[#1A1A1A] max-w-[140px] truncate">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#6B7280] capitalize whitespace-nowrap">
                              {product.category?.replace(/-/g, ' ')}
                            </td>
                            <td className="px-4 py-3 text-sm text-[#1A1A1A] whitespace-nowrap">
                              {formatPrice(product.price)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-medium ${isOut ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-[#1A1A1A]'}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#6B7280]">
                              {product.lowStockThreshold}
                            </td>
                            <td className="px-4 py-3">
                              <StockBadge stock={product.stock} threshold={product.lowStockThreshold} />
                            </td>
                            <td className="px-4 py-3">
                              {/* Toggle switch */}
                              <button
                                onClick={() => handleToggleActive(product._id)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition duration-300 focus:outline-none ${
                                  product.isActive ? 'bg-[#1A1A1A]' : 'bg-[#EAEAEA]'
                                }`}
                                title={product.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition duration-300 ${
                                  product.isActive ? 'translate-x-4' : 'translate-x-1'
                                }`} />
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setEditProduct(product)}
                                className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300 whitespace-nowrap"
                              >
                                Edit Stock
                              </button>
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

      {/* Single stock update modal */}
      <StockUpdateModal
        product={editProduct}
        onSave={handleStockSave}
        onClose={() => setEditProduct(null)}
      />
    </div>
  );
};

export default AdminInventory;
