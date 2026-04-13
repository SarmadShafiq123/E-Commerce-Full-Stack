import { Link, useLocation } from 'react-router-dom';

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  return (
    <div className="bg-[#FAFAFA] min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-light text-[#1A1A1A] tracking-tight mb-2">Order Placed</h1>
        <p className="text-sm text-[#6B7280] leading-relaxed mb-2">
          Thank you for your order. A confirmation email is on its way.
        </p>
        {orderId && (
          <p className="text-xs text-[#6B7280] font-mono mb-8">
            #{orderId.slice(-8).toUpperCase()}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link
            to="/orders"
            className="w-full py-3.5 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-full hover:opacity-80 transition duration-300 text-center"
          >
            View Orders
          </Link>
          <Link
            to="/products"
            className="w-full py-3.5 border border-[#EAEAEA] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full hover:bg-white transition duration-300 text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
