import { useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

const Wishlist = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { wishlist, loading } = useContext(WishlistContext);

  if (authLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: '/wishlist' }} replace />;

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8 sm:mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Account</p>
          <div className="flex items-end gap-3">
            <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Saved Pieces</h1>
            {wishlist.length > 0 && (
              <span className="text-sm text-[#6B7280] mb-0.5">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</span>
            )}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : wishlist.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#F5F5F5]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <p className="text-[#6B7280] text-sm mb-2">Your wishlist is empty</p>
            <p className="text-xs text-[#6B7280] mb-8">Save pieces you love and find them here</p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase px-8 py-3.5 rounded-full hover:opacity-80 transition duration-300">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {wishlist.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
