import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { orderAPI, productAPI, couponAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import PageSEO from '../seo/PageSEO';

const paymentMethods = [
  { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'easypaisa', label: 'Easypaisa', icon: '📱' },
  { value: 'jazzcash', label: 'JazzCash', icon: '📲' },
];

const paymentInstructions = {
  'bank-transfer': { title: 'Bank Transfer', lines: ['Account Name: Luxe Bags Store', 'Account Number: PK12BANK0000123456789012', 'Transfer the amount and await admin verification.'] },
  'easypaisa': { title: 'Easypaisa', lines: ['Account Number: 03001234567', 'Send payment and await admin verification.'] },
  'jazzcash': { title: 'JazzCash', lines: ['Account Number: 03007654321', 'Send payment and await admin verification.'] },
};

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs tracking-wide text-[#6B7280] mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
    />
  </div>
);

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '', phone: user?.phone || '',
    street: user?.address?.street || '', city: user?.address?.city || '',
    province: user?.address?.province || '', postalCode: user?.address?.postalCode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode]   = useState('');
  const [couponData, setCouponData]   = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError(''); setCouponData(null);
    try {
      const { data } = await couponAPI.validate({ code: couponCode.trim(), orderTotal: getCartTotal() });
      setCouponData(data.data);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    } finally { setCouponLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    // Pre-validate stock for each cart item before hitting the server
    try {
      for (const item of cart) {
        const { data } = await productAPI.getProductById(item.productId);
        const product = data.data;
        if (!product.isActive) {
          setError(`"${item.name}" is no longer available.`);
          setLoading(false);
          return;
        }
        if (product.stock < item.quantity) {
          setError(
            `"${item.name}" only has ${product.stock} unit${product.stock === 1 ? '' : 's'} left. Please update your cart.`
          );
          setLoading(false);
          return;
        }
      }
    } catch {
      setError('Could not verify stock. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const { data } = await orderAPI.createOrder({
        items: cart.map((i) => ({ product: i.productId, name: i.name, image: i.image, price: i.price, quantity: i.quantity })),
        shippingAddress: formData,
        paymentMethod,
        totalPrice: couponData ? couponData.finalTotal : getCartTotal(),
        couponCode: couponData ? couponData.code : '',
        discount: couponData ? couponData.discount : 0,
      });
      clearCart();
      navigate('/order-success', { state: { orderId: data.data._id } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const instructions = paymentInstructions[paymentMethod];

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <PageSEO title="Checkout" noIndex={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8 sm:mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Final Step</p>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">

            {/* Shipping */}
            <div className="bg-white rounded-2xl p-6">
              <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-5">Shipping Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Full Name" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your name" />
                <InputField label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+92 300 0000000" />
                <div className="sm:col-span-2">
                  <InputField label="Street Address" type="text" name="street" value={formData.street} onChange={handleChange} required placeholder="Street, area" />
                </div>
                <InputField label="City" type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="City" />
                <InputField label="Province" type="text" name="province" value={formData.province} onChange={handleChange} required placeholder="Province" />
                <InputField label="Postal Code" type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required placeholder="Postal code" />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-6">
              <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-5">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm transition duration-300 ${
                      paymentMethod === m.value
                        ? 'border-[#1A1A1A] bg-[#FAFAFA] text-[#1A1A1A]'
                        : 'border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span className="text-xs tracking-wide">{m.label}</span>
                  </button>
                ))}
              </div>

              {instructions && (
                <div className="mt-4 p-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA]">
                  <p className="text-xs font-medium text-[#1A1A1A] mb-2">{instructions.title} Details</p>
                  {instructions.lines.map((line, i) => (
                    <p key={i} className="text-xs text-[#6B7280] leading-relaxed">{line}</p>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sticky top-24">
              <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-5">Order Summary</p>
              <div className="space-y-4 mb-5">
                {cart.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <img src={item.image} alt={item.name} loading="lazy" className="w-14 h-16 object-cover rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#1A1A1A] truncate">{item.name}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">Qty {item.quantity}</p>
                      <p className="text-xs text-[#1A1A1A] mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#EAEAEA] pt-4 flex justify-between">
                <span className="text-sm font-medium text-[#1A1A1A]">Total</span>
                <span className="text-sm font-medium text-[#1A1A1A]">{formatPrice(getCartTotal())}</span>
              </div>

              {/* Coupon */}
              <div className="mt-4 pt-4 border-t border-[#EAEAEA]">
                <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-2">Coupon Code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponData(null); setCouponError(''); }}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-3 py-2 bg-[#1A1A1A] text-white text-xs rounded-xl hover:opacity-80 transition duration-300 disabled:opacity-40 shrink-0"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
                {couponData && (
                  <div className="mt-2 p-2.5 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs text-green-600 font-medium">{couponData.code} applied!</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-green-600">Discount</span>
                      <span className="text-xs text-green-600">-{formatPrice(couponData.discount)}</span>
                    </div>
                    <div className="flex justify-between mt-0.5 pt-1 border-t border-green-100">
                      <span className="text-xs font-medium text-[#1A1A1A]">Final Total</span>
                      <span className="text-xs font-medium text-[#1A1A1A]">{formatPrice(couponData.finalTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
