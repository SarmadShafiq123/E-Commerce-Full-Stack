import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import Spinner from '../components/Spinner';
import { homepageAPI } from '../services/api';

// ── SlideForm ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '',
  subtitle: '',
  buttonText: 'Shop Now',
  link: '/products',
  active: true,
  order: 0,
  startDate: '',
  endDate: '',
};

const SlideForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(initial?.image || '');
  const fileRef = useRef();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);
    onSave(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image upload */}
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-2">
          Slide Image {!initial && <span className="text-red-400">*</span>}
        </label>
        <div
          onClick={() => fileRef.current.click()}
          className="relative rounded-2xl overflow-hidden aspect-[16/7] bg-[#F5F5F5] border-2 border-dashed border-[#EAEAEA] cursor-pointer hover:border-[#1A1A1A] transition duration-300 flex items-center justify-center"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <svg className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-xs text-[#9CA3AF]">Click to upload image</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="The Art of Timeless Luxury"
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">Subtitle</label>
          <input
            value={form.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            placeholder="Handcrafted leather goods..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">Button Text</label>
          <input
            value={form.buttonText}
            onChange={(e) => set('buttonText', e.target.value)}
            placeholder="Shop Now"
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">Button Link</label>
          <input
            value={form.link}
            onChange={(e) => set('link', e.target.value)}
            placeholder="/products"
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">Order</label>
          <input
            type="number"
            min="0"
            value={form.order}
            onChange={(e) => set('order', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <button
            type="button"
            onClick={() => set('active', !form.active)}
            className={`relative w-10 h-5 rounded-full transition duration-300 ${form.active ? 'bg-[#1A1A1A]' : 'bg-[#E5E7EB]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.active ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-[#6B7280]">{form.active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Scheduling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">Start Date (optional)</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">End Date (optional)</label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => set('endDate', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase py-3 rounded-xl hover:opacity-80 disabled:opacity-50 transition duration-300"
        >
          {saving ? 'Saving…' : 'Save Slide'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-[#EAEAEA] text-sm text-[#6B7280] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition duration-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

// ── SliderManager ─────────────────────────────────────────────────────────────
const SliderManager = ({ slides, onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleAdd = async (fd) => {
    setSaving(true);
    try {
      await homepageAPI.addSlide(fd);
      setShowAdd(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add slide');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, fd) => {
    setSaving(true);
    try {
      await homepageAPI.updateSlide(id, fd);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slide?')) return;
    setDeleting(id);
    try {
      await homepageAPI.deleteSlide(id);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete slide');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (slide) => {
    const fd = new FormData();
    fd.append('active', !slide.active);
    fd.append('title', slide.title);
    await homepageAPI.updateSlide(slide._id, fd).catch(() => {});
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#1A1A1A] tracking-wide">Hero Slides</h2>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="flex items-center gap-1.5 text-xs tracking-widest uppercase bg-[#1A1A1A] text-white px-4 py-2 rounded-xl hover:opacity-80 transition duration-300"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Slide
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#EAEAEA]">
          <p className="text-xs tracking-widest uppercase text-[#6B7280] mb-4">New Slide</p>
          <SlideForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
        </div>
      )}

      {/* Slide list */}
      {slides.length === 0 && !showAdd && (
        <div className="text-center py-12 text-[#9CA3AF] text-sm">
          No slides yet. Add your first hero slide.
        </div>
      )}

      {slides.map((slide) => (
        <div key={slide._id} className="bg-white rounded-2xl shadow-sm border border-[#EAEAEA] overflow-hidden">
          {editingId === slide._id ? (
            <div className="p-4">
              <p className="text-xs tracking-widest uppercase text-[#6B7280] mb-4">Edit Slide</p>
              <SlideForm
                initial={{
                  title: slide.title,
                  subtitle: slide.subtitle || '',
                  buttonText: slide.buttonText || 'Shop Now',
                  link: slide.link || '/products',
                  active: slide.active,
                  order: slide.order,
                  startDate: slide.startDate ? slide.startDate.slice(0, 16) : '',
                  endDate: slide.endDate ? slide.endDate.slice(0, 16) : '',
                  image: slide.image,
                }}
                onSave={(fd) => handleUpdate(slide._id, fd)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4">
              {/* Thumbnail */}
              <div className="w-20 h-14 rounded-xl overflow-hidden bg-[#F5F5F5] shrink-0">
                <img src={slide.image} alt={slide.title} loading="lazy" className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">{slide.title}</p>
                <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{slide.subtitle}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] tracking-widest uppercase text-[#9CA3AF]">
                    Order: {slide.order}
                  </span>
                  {slide.clicks > 0 && (
                    <span className="text-[10px] tracking-widest uppercase text-[#9CA3AF]">
                      {slide.clicks} clicks
                    </span>
                  )}
                  {slide.startDate && (
                    <span className="text-[10px] text-amber-500">Scheduled</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(slide)}
                  className={`relative w-9 h-5 rounded-full transition duration-300 ${slide.active ? 'bg-[#1A1A1A]' : 'bg-[#E5E7EB]'}`}
                  title={slide.active ? 'Deactivate' : 'Activate'}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${slide.active ? 'left-4' : 'left-0.5'}`} />
                </button>

                <button
                  onClick={() => { setEditingId(slide._id); setShowAdd(false); }}
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] transition duration-300"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDelete(slide._id)}
                  disabled={deleting === slide._id}
                  className="p-2 rounded-xl text-[#6B7280] hover:text-red-500 hover:bg-red-50 transition duration-300 disabled:opacity-50"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── HomepageEditor (top bar + publish) ────────────────────────────────────────
const HomepageEditor = ({ config, onRefresh }) => {
  const [form, setForm] = useState({
    text: config?.topBar?.text || '',
    link: config?.topBar?.link || '',
    active: config?.topBar?.active ?? true,
  });
  const [published, setPublished] = useState(config?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await homepageAPI.updateHomepage({
        topBar: { text: form.text, link: form.link, active: form.active },
        published,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EAEAEA] p-4 space-y-4">
      <h2 className="text-sm font-medium text-[#1A1A1A] tracking-wide">Top Bar</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">Message</label>
          <input
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            placeholder="Free shipping on orders over Rs. 5,000"
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-[#6B7280] mb-1.5">Link (optional)</label>
          <input
            value={form.link}
            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            placeholder="/products"
            className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition duration-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
            className={`relative w-10 h-5 rounded-full transition duration-300 ${form.active ? 'bg-[#1A1A1A]' : 'bg-[#E5E7EB]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.active ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-[#6B7280]">Top bar {form.active ? 'visible' : 'hidden'}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPublished((p) => !p)}
            className={`relative w-10 h-5 rounded-full transition duration-300 ${published ? 'bg-emerald-500' : 'bg-[#E5E7EB]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${published ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-[#6B7280]">{published ? 'Published' : 'Draft'}</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl text-xs tracking-widest uppercase transition duration-300 ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-[#1A1A1A] text-white hover:opacity-80 disabled:opacity-50'
        }`}
      >
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
};

// ── AdminHomepage (page) ──────────────────────────────────────────────────────
const AdminHomepage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const { data } = await homepageAPI.getHomepageAdmin();
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <AdminSidebar />

        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">CMS</p>
            <h1 className="text-2xl font-light text-[#1A1A1A] tracking-tight">Homepage Editor</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : (
            <>
              <HomepageEditor config={config} onRefresh={fetchConfig} />
              <SliderManager
                slides={config?.heroSlider?.slice().sort((a, b) => a.order - b.order) || []}
                onRefresh={fetchConfig}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHomepage;
