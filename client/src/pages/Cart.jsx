import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import PageSEO from '../seo/PageSEO';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) navigate('/login', { state: { from: { pathname: '/checkout' } } });
    else navigate('/checkout');
  };

  const getCartWhatsAppURL = () => {
    const items = cart.map(i => `• ${i.name} x${i.quantity} — Rs. ${i.price * i.quantity}`).join('\n');
    const msg = `Hello! I want to order from Luxe Bags:\n\n🛍️ My Cart:\n${items}\n\n💰 Total: Rs. ${getCartTotal()}\n\nPlease confirm and share payment details.`;
    return `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  if (cart.length === 0) {
    return (
      <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center px-4">
        <PageSEO title="Shopping Bag" noIndex={true} />
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#F5F5F5]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </div>
          <h1 className="text-xl font-light text-[#1A1A1A] mb-2">Your bag is empty</h1>
          <p className="text-sm text-[#6B7280] mb-8">Add something beautiful to get started.</p>
          <Link to="/products" className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase px-8 py-3.5 rounded-full hover:opacity-80 transition duration-300">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <PageSEO title="Shopping Bag" noIndex={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8 sm:mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Review</p>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Shopping Bag</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.productId} className="flex gap-4 bg-white rounded-2xl p-4">
                <Link to={`/products/${item.productId}`} className="shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl"
                  />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-sm font-medium text-[#1A1A1A] truncate">{item.name}</h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-[#EAEAEA] rounded-full overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#FAFAFA] transition duration-300 text-sm"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm text-[#1A1A1A]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#FAFAFA] transition duration-300 text-sm"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-[#1A1A1A]">{formatPrice(item.price * item.quantity)}</span>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        aria-label="Remove item"
                        className="text-[#6B7280] hover:text-red-400 transition duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sticky top-24">
              <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A] mb-5">Order Summary</p>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm text-[#6B7280]">
                  <span>Subtotal</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-[#6B7280]">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <div className="border-t border-[#EAEAEA] pt-4 mb-6 flex justify-between">
                <span className="text-sm font-medium text-[#1A1A1A]">Total</span>
                <span className="text-sm font-medium text-[#1A1A1A]">{formatPrice(getCartTotal())}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 mb-3"
              >
                Checkout
              </button>
              {import.meta.env.VITE_WHATSAPP_NUMBER && (
                <a
                  href={getCartWhatsAppURL()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3.5 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full text-center hover:bg-[#FAFAFA] transition duration-300"
                >
                  Order via WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
