import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/Spinner';
import AdminSidebar from '../components/AdminSidebar';
import InvoiceButton from '../components/InvoiceButton';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

const statusColors = {
  pending:    'bg-amber-50 text-amber-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped:    'bg-purple-50 text-purple-600',
  delivered:  'bg-green-50 text-green-600',
  cancelled:  'bg-red-50 text-red-400',
};

const paymentLabels = {
  cod: 'Cash on Delivery',
  'bank-transfer': 'Bank Transfer',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
    />
  </div>
);

const AdminOrders = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState('');
  const [updateData, setUpdateData] = useState({
    orderStatus: '', paymentStatus: '', adminNote: '',
    trackingNumber: '', courierName: '',
  });

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAllOrders(filter ? { status: filter } : {});
      setOrders(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleEdit = (order) => {
    setEditingOrder(order._id);
    setUpdateData({
      orderStatus:    order.orderStatus,
      paymentStatus:  order.paymentStatus,
      adminNote:      order.adminNote || '',
      trackingNumber: order.trackingNumber || '',
      courierName:    order.courierName || '',
    });
  };

  const handleUpdate = async (orderId) => {
    setSaving(true);
    try {
      await adminAPI.updateOrder(orderId, updateData);
      await fetchOrders();
      setEditingOrder(null);
      showToast('Order updated successfully');
    } catch (err) {
      showToast('Update failed — please try again');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setUpdateData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />

          <main className="flex-1 min-w-0">

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Admin</p>
                <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Orders</h1>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-[#EAEAEA] rounded-full text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300 cursor-pointer"
              >
                <option value="">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Toast */}
            {toast && (
              <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 text-xs rounded-xl border border-green-100">
                {toast}
              </div>
            )}

            {loading ? <Spinner /> : orders.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-[#6B7280]">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white rounded-2xl overflow-hidden">

                    {/* ── Card header ── */}
                    <div className="px-5 sm:px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-mono text-[#1A1A1A] font-medium">#{order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full ${statusColors[order.orderStatus] || 'bg-[#F5F5F5] text-[#6B7280]'}`}>
                          {order.orderStatus}
                        </span>
                        <span className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full ${order.paymentStatus === 'verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* ── Timeline ── */}
                    <div className="px-5 sm:px-6 pb-4">
                      <OrderStatusTimeline
                        currentStatus={order.orderStatus}
                        statusHistory={order.statusHistory || []}
                      />
                    </div>

                    {/* ── Customer + Shipping ── */}
                    <div className="mx-5 sm:mx-6 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAFAFA] rounded-xl">
                      <div>
                        <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-1.5">Customer</p>
                        <p className="text-sm text-[#1A1A1A]">{order.user?.name}</p>
                        <p className="text-xs text-[#6B7280]">{order.user?.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-1.5">Shipping</p>
                        <p className="text-sm text-[#1A1A1A]">{order.shippingAddress.name}</p>
                        <p className="text-xs text-[#6B7280]">{order.shippingAddress.phone}</p>
                        <p className="text-xs text-[#6B7280]">
                          {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.province}
                        </p>
                      </div>
                    </div>

                    {/* ── Tracking info (read-only display) ── */}
                    {(order.trackingNumber || order.courierName) && editingOrder !== order._id && (
                      <div className="mx-5 sm:mx-6 mb-4 flex flex-wrap gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                        {order.courierName && (
                          <div>
                            <p className="text-[10px] tracking-widest uppercase text-purple-400 mb-1">Courier</p>
                            <p className="text-sm text-[#1A1A1A]">{order.courierName}</p>
                          </div>
                        )}
                        {order.trackingNumber && (
                          <div>
                            <p className="text-[10px] tracking-widest uppercase text-purple-400 mb-1">Tracking No.</p>
                            <p className="text-sm text-[#1A1A1A] font-mono tracking-wider">{order.trackingNumber}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Items ── */}
                    <div className="px-5 sm:px-6 mb-4">
                      <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-2">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} loading="lazy" className="w-10 h-12 object-cover rounded-lg shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#1A1A1A] truncate">{item.name}</p>
                              <p className="text-xs text-[#6B7280]">Qty {item.quantity} × {formatPrice(item.price)}</p>
                            </div>
                            <p className="text-sm text-[#1A1A1A] shrink-0">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-3 pt-3 border-t border-[#EAEAEA]">
                        <span className="text-xs text-[#6B7280]">{paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
                        <span className="text-sm font-medium text-[#1A1A1A]">{formatPrice(order.totalPrice)}</span>
                      </div>
                    </div>

                    {/* ── Edit form / footer ── */}
                    {editingOrder === order._id ? (
                      <div className="border-t border-[#EAEAEA] px-5 sm:px-6 py-5 space-y-4 bg-[#FAFAFA]">

                        {/* Status row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Order Status</label>
                            <select
                              value={updateData.orderStatus}
                              onChange={set('orderStatus')}
                              className="w-full px-3 py-2.5 bg-white border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
                            >
                              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Payment Status</label>
                            <select
                              value={updateData.paymentStatus}
                              onChange={set('paymentStatus')}
                              className="w-full px-3 py-2.5 bg-white border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
                            >
                              <option value="pending">Pending</option>
                              <option value="verified">Verified</option>
                            </select>
                          </div>
                        </div>

                        {/* Tracking row */}
                        <div className="grid grid-cols-2 gap-3">
                          <InputField
                            label="Courier Name"
                            type="text"
                            value={updateData.courierName}
                            onChange={set('courierName')}
                            placeholder="e.g. Leopards, TCS"
                          />
                          <InputField
                            label="Tracking Number"
                            type="text"
                            value={updateData.trackingNumber}
                            onChange={set('trackingNumber')}
                            placeholder="e.g. LP123456789"
                          />
                        </div>

                        {/* Note */}
                        <div>
                          <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">Note to Customer</label>
                          <textarea
                            value={updateData.adminNote}
                            onChange={set('adminNote')}
                            rows={2}
                            placeholder="Optional message visible to the customer..."
                            className="w-full px-3 py-2.5 bg-white border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300 resize-none"
                          />
                        </div>

                        {/* Notification hint */}
                        {(updateData.orderStatus === 'shipped' || updateData.orderStatus === 'delivered') &&
                          updateData.orderStatus !== order.orderStatus && (
                          <p className="text-[10px] text-[#6B7280] bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl">
                            📧 Email + WhatsApp notification will be sent to the customer on save.
                          </p>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleUpdate(order._id)}
                            disabled={saving}
                            className="flex-1 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => setEditingOrder(null)}
                            className="flex-1 py-2.5 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:bg-white transition duration-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-[#EAEAEA] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {order.adminNote ? (
                          <p className="text-xs text-[#6B7280] italic max-w-sm truncate">"{order.adminNote}"</p>
                        ) : <span />}
                        <div className="flex items-center gap-4 flex-wrap">
                          <InvoiceButton orderId={order._id} compact />
                          <button
                            onClick={() => handleEdit(order)}
                            className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300"
                          >
                            Edit →
                          </button>
                        </div>
                      </div>
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

export default AdminOrders;
