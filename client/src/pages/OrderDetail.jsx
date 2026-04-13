import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/Spinner';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

const COURIER_TRACKING_URLS = {
  'leopards': 'https://www.leopardscourier.com/leopards-courier/track-your-parcel/',
  'tcs': 'https://www.tcs.com.pk/tracking.php',
  'trax': 'https://app.trax.pk/tracking',
  'postex': 'https://postex.pk/tracking',
  'm&p': 'https://www.mulphyco.com/tracking',
  'call courier': 'https://callcourier.com.pk/tracking',
};

const getTrackingUrl = (courierName, trackingNumber) => {
  if (!courierName || !trackingNumber) return null;
  const key = courierName.toLowerCase().trim();
  const base = COURIER_TRACKING_URLS[key];
  if (!base) return null;
  return `${base}?${trackingNumber}`;
};

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

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    orderAPI.getOrderById(id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => setError('Order not found or you are not authorised to view it.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (error) return (
    <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm text-[#6B7280] mb-6">{error}</p>
        <Link to="/orders" className="text-xs tracking-widest uppercase text-[#1A1A1A] underline underline-offset-4">
          Back to Orders
        </Link>
      </div>
    </div>
  );

  const trackingUrl = getTrackingUrl(order.courierName, order.trackingNumber);

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Back */}
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300 mb-8">
          ← Orders
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Order</p>
            <h1 className="text-xl font-light text-[#1A1A1A] tracking-tight font-mono">
              #{order._id.slice(-10).toUpperCase()}
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-5">Order Progress</p>
          <OrderStatusTimeline
            currentStatus={order.orderStatus}
            statusHistory={order.statusHistory || []}
          />
        </div>

        {/* Tracking card — only shown when shipped/delivered and tracking info exists */}
        {(order.trackingNumber || order.courierName) && (
          <div className="bg-white rounded-2xl p-5 mb-4 border border-[#EAEAEA]">
            <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-4">Tracking Information</p>
            <div className="grid grid-cols-2 gap-4">
              {order.courierName && (
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-1">Courier</p>
                  <p className="text-sm text-[#1A1A1A]">{order.courierName}</p>
                </div>
              )}
              {order.trackingNumber && (
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-1">Tracking No.</p>
                  <p className="text-sm text-[#1A1A1A] font-mono tracking-wider">{order.trackingNumber}</p>
                </div>
              )}
            </div>
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Track on {order.courierName}
              </a>
            )}
          </div>
        )}

        {/* Admin note to customer */}
        {order.adminNote && (
          <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-4 mb-4">
            <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-1.5">Note from Luxe Bags</p>
            <p className="text-sm text-[#1A1A1A] leading-relaxed">{order.adminNote}</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-4">Items Ordered</p>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} loading="lazy" className="w-12 h-14 object-cover rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A1A1A] truncate">{item.name}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Qty {item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <p className="text-sm text-[#1A1A1A] shrink-0">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#EAEAEA] mt-4 pt-4 flex justify-between">
            <span className="text-sm text-[#6B7280]">Total</span>
            <span className="text-sm font-medium text-[#1A1A1A]">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>

        {/* Shipping + Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5">
            <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-3">Ship To</p>
            <p className="text-sm text-[#1A1A1A]">{order.shippingAddress.name}</p>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">{order.shippingAddress.phone}</p>
          </div>
          <div className="bg-white rounded-2xl p-5">
            <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-3">Payment</p>
            <p className="text-sm text-[#1A1A1A]">{paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
            <span className={`inline-block mt-2 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full ${order.paymentStatus === 'verified' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetail;
