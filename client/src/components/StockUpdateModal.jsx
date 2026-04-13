import { useState, useEffect } from 'react';
import Modal from './Modal';

/**
 * Single-product stock update modal.
 * Props: product, onSave(id, { stock, lowStockThreshold }), onClose
 */
const StockUpdateModal = ({ product, onSave, onClose }) => {
  const [stock, setStock]         = useState('');
  const [threshold, setThreshold] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (product) {
      setStock(String(product.stock ?? 0));
      setThreshold(String(product.lowStockThreshold ?? 5));
      setError('');
    }
  }, [product]);

  const handleSave = async () => {
    const s = parseInt(stock);
    const t = parseInt(threshold);
    if (isNaN(s) || s < 0) { setError('Stock must be 0 or more'); return; }
    if (isNaN(t) || t < 0) { setError('Threshold must be 0 or more'); return; }
    setSaving(true);
    try {
      await onSave(product._id, { stock: s, lowStockThreshold: t });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={!!product} onClose={onClose} title="Update Stock">
      <div className="space-y-4">
        {/* Product preview */}
        <div className="flex items-center gap-3 p-3 bg-[#FAFAFA] rounded-xl">
          <img
            src={product.images?.[0]?.url || '/placeholder.jpg'}
            alt={product.name}
            className="w-12 h-14 object-cover rounded-lg shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">{product.name}</p>
            <p className="text-xs text-[#6B7280] capitalize mt-0.5">{product.category?.replace(/-/g, ' ')}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Current stock: <span className="text-[#1A1A1A] font-medium">{product.stock}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">New Stock Qty</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
            />
          </div>
          <div>
            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Low Stock Alert At</label>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
            />
          </div>
        </div>

        {/* Preview badge */}
        {(() => {
          const s = parseInt(stock);
          const t = parseInt(threshold);
          if (isNaN(s)) return null;
          if (s === 0) return (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
              ⚠️ Setting stock to 0 will mark this product as out of stock.
            </p>
          );
          if (!isNaN(t) && s <= t) return (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
              ⚠️ This will trigger a low stock alert (stock ≤ threshold).
            </p>
          );
          return null;
        })()}

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:bg-[#FAFAFA] transition duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StockUpdateModal;
