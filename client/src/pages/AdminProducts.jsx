import { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import AdminSidebar from '../components/AdminSidebar';

const categories = ['handbags', 'tote-bags', 'clutches', 'shoulder-bags', 'crossbody', 'wallets'];

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
    />
  </div>
);

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'handbags', stock: '', isActive: true });
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  useEffect(() => { fetchProducts(); }, [page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getAllProductsAdmin({ page, limit: 10 });
      setProducts(data.data);
      setPages(data.pages);
    } catch { showToast('Error fetching products', 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingImages.length > 5) { showToast('Maximum 5 images allowed', 'error'); return; }
    setNewImages(files);
  };

  const handleRemoveExistingImage = async (publicId) => {
    if (!editingProduct) return;
    try {
      await productAPI.deleteProductImage(editingProduct._id, publicId);
      setExistingImages(existingImages.filter((img) => img.public_id !== publicId));
      showToast('Image removed');
    } catch { showToast('Failed to remove image', 'error'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      ['name', 'description', 'price', 'category', 'stock'].forEach((k) => data.append(k, formData[k]));
      data.append('isActive', formData.isActive.toString());
      newImages.forEach((img) => data.append('images', img));
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct._id, data);
        showToast('Product updated');
      } else {
        await productAPI.createProduct(data);
        showToast('Product created');
        setPage(1);
      }
      resetForm();
      await fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally { setSubmitting(false); }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, description: product.description, price: product.price, category: product.category, stock: product.stock, isActive: product.isActive });
    setExistingImages(product.images || []);
    setShowModal(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await productAPI.deleteProduct(product._id);
      setProducts(products.filter((p) => p._id !== product._id));
      showToast('Product deleted');
    } catch { showToast('Delete failed', 'error'); }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', category: 'handbags', stock: '', isActive: true });
    setNewImages([]); setExistingImages([]); setEditingProduct(null); setShowModal(false);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Admin</p>
                <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Products</h1>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase px-5 py-2.5 rounded-full hover:opacity-80 transition duration-300"
              >
                + Add Product
              </button>
            </div>

            {toast.msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-xs ${toast.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                {toast.msg}
              </div>
            )}

            {loading ? <Spinner /> : (
              <>
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#EAEAEA]">
                          {['Image', 'Name', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                            <th key={h} className="text-left text-[10px] tracking-widest uppercase text-[#6B7280] px-4 py-3 font-normal">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {products.map((product) => (
                          <tr key={product._id} className="hover:bg-[#FAFAFA] transition duration-300">
                            <td className="px-4 py-3">
                              <img src={product.images[0]?.url || '/placeholder.jpg'} alt={product.name} loading="lazy" className="w-10 h-12 object-cover rounded-lg" />
                            </td>
                            <td className="px-4 py-3 text-sm text-[#1A1A1A] max-w-[160px] truncate">{product.name}</td>
                            <td className="px-4 py-3 text-xs text-[#6B7280] capitalize">{product.category.replace(/-/g, ' ')}</td>
                            <td className="px-4 py-3 text-sm text-[#1A1A1A]">{formatPrice(product.price)}</td>
                            <td className="px-4 py-3 text-sm text-[#1A1A1A]">{product.stock}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full ${product.isActive ? 'bg-green-50 text-green-600' : 'bg-[#F5F5F5] text-[#6B7280]'}`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button onClick={() => handleEdit(product)} className="text-xs text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">Edit</button>
                                <button onClick={() => handleDelete(product)} className="text-xs text-[#6B7280] hover:text-red-400 transition duration-300">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
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

      <Modal isOpen={showModal} onClose={resetForm} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Product Name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Classic Leather Tote" />

          <div>
            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Product description..."
              className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Price (Rs.)" type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" placeholder="0" />
            <InputField label="Stock" type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" placeholder="0" />
          </div>

          <div>
            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat.replace(/-/g, ' ')}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded" />
            <span className="text-sm text-[#1A1A1A]">Active (visible to customers)</span>
          </label>

          {editingProduct && existingImages.length > 0 && (
            <div>
              <p className="text-xs tracking-wide text-[#6B7280] mb-2">Current Images</p>
              <div className="flex gap-2 flex-wrap">
                {existingImages.map((img) => (
                  <div key={img.public_id} className="relative">
                    <img src={img.url} alt="" loading="lazy" className="w-16 h-16 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(img.public_id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1A1A1A] text-white rounded-full text-xs flex items-center justify-center leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">
              {editingProduct ? 'Add Images' : 'Images'} (max 5, JPG/PNG/WebP)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="w-full text-sm text-[#6B7280] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-[#1A1A1A] file:text-white hover:file:opacity-80 file:transition file:duration-300 cursor-pointer"
            />
            {newImages.length > 0 && <p className="text-xs text-[#6B7280] mt-1">{newImages.length} file(s) selected</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-3 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:bg-[#FAFAFA] transition duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProducts;
