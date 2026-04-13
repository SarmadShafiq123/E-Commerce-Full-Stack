import { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';
import Spinner from '../components/Spinner';
import AdminSidebar from '../components/AdminSidebar';

const INTENT_LABELS = {
  shipping:     'Shipping',
  returns:      'Returns',
  stock:        'Stock',
  payment:      'Payment',
  order_status: 'Order Status',
  discount:     'Discounts',
  contact:      'Contact',
  greeting:     'Greeting',
  goodbye:      'Goodbye',
  unknown:      'Unknown / Fallback',
};

const AdminChatbot = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null); // intent string
  const [editText, setEditText]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await aiAPI.getChatbotResponses();
      setResponses(data.data);
    } catch { showToast('Failed to load responses', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const startEdit = (r) => { setEditing(r.intent); setEditText(r.response); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await aiAPI.upsertChatbotResponse({ intent: editing, response: editText, isActive: true });
      showToast('Response saved');
      setEditing(null);
      fetch();
    } catch { showToast('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleReset = async (r) => {
    if (!r._id) return;
    if (!window.confirm('Reset to default response?')) return;
    try {
      await aiAPI.deleteChatbotResponse(r._id);
      showToast('Reset to default');
      fetch();
    } catch { showToast('Reset failed', 'error'); }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0">
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">AI</p>
              <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Chatbot Responses</h1>
              <p className="text-sm text-[#6B7280] mt-1">Customise what the AI assistant says for each intent.</p>
            </div>

            {toast.msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-xs ${toast.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                {toast.msg}
              </div>
            )}

            {loading ? <Spinner /> : (
              <div className="space-y-3">
                {responses.map((r) => (
                  <div key={r.intent} className="bg-white rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {INTENT_LABELS[r.intent] || r.intent}
                        </p>
                        {r.isCustom && (
                          <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Custom</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {r.isCustom && (
                          <button onClick={() => handleReset(r)} className="text-xs text-[#6B7280] hover:text-red-400 transition duration-300">
                            Reset
                          </button>
                        )}
                        <button onClick={() => startEdit(r)} className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
                          Edit
                        </button>
                      </div>
                    </div>

                    {editing === r.intent ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300 resize-none"
                        />
                        <div className="flex gap-3">
                          <button onClick={handleSave} disabled={saving}
                            className="flex-1 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="flex-1 py-2.5 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:bg-[#FAFAFA] transition duration-300">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#6B7280] leading-relaxed">{r.response}</p>
                    )}
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

export default AdminChatbot;
