import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/Spinner';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

const statusColors = {
  pending:    'bg-amber-50 text-amber-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped:    'bg-purple-50 text-purple-600',
  delivered:  'bg-green-50 text-green-600',
  cancelled:  'bg-red-50 text-red-400',
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(({ data }) => setOrders(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Account</p>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#F5F5F5]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <p className="text-[#6B7280] text-sm mb-6">No orders yet</p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase px-8 py-3.5 rounded-full hover:opacity-80 transition duration-300">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-2xl overflow-hidden">

                {/* Header */}
                <div className="px-5 sm:px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#6B7280] mb-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-[#1A1A1A] font-mono font-medium">#{order._id.slice(-8).toUpperCase()}</p>
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

                {/* Timeline */}
                <div className="px-5 sm:px-6 pb-4">
                  <OrderStatusTimeline
                    currentStatus={order.orderStatus}
                    statusHistory={order.statusHistory || []}
                  />
                </div>

                {/* Tracking pill — only when shipped/delivered */}
                {(order.trackingNumber || order.courierName) && (
                  <div className="mx-5 sm:mx-6 mb-4 flex flex-wrap items-center gap-3 px-4 py-3 bg-purple-50 rounded-xl border border-purple-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    {order.courierName && (
                      <span className="text-xs text-purple-700">{order.courierName}</span>
                    )}
                    {order.trackingNumber && (
                      <span className="text-xs font-mono text-purple-700 tracking-wider">{order.trackingNumber}</span>
                    )}
                  </div>
                )}

                {/* Items strip */}
                <div className="px-5 sm:px-6 pb-4 flex gap-2 overflow-x-auto">
                  {order.items.map((item, idx) => (
                    <img
                      key={idx}
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-14 h-16 object-cover rounded-xl shrink-0"
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-[#EAEAEA] px-5 sm:px-6 py-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1A1A1A]">{formatPrice(order.totalPrice)}</p>
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300"
                  >
                    View Details →
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
