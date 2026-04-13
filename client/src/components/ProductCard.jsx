import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import { formatPrice } from '../utils/formatPrice';

// Renders up to 3 images in a stacked card effect
const StackedImages = ({ images, name }) => {
  const stack = images.slice(0, 3);

  return (
    <div className="relative h-64 w-full">
      {/* Back cards (decorative) */}
      {stack.length >= 3 && (
        <div className="absolute inset-x-4 top-3 h-full rounded-2xl bg-[#E8E4E0] shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-2" />
      )}
      {stack.length >= 2 && (
        <div className="absolute inset-x-2 top-1.5 h-full rounded-2xl bg-[#EDE9E5] shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1" />
      )}

      {/* Front card — actual image */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-[#F5F5F5] shadow-md transition-transform duration-300 group-hover:-translate-y-1">
        <img
          src={stack[0].url}
          alt={name}
          loading="lazy"
          className="w-full h-full object-contain transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
    </div>
  );
};

// Single image — reduced size with object-contain
const SingleImage = ({ image, name }) => (
  <div className="h-64 w-full rounded-2xl overflow-hidden bg-[#F5F5F5]">
    <img
      src={image?.url || '/placeholder.jpg'}
      alt={name}
      loading="lazy"
      className="w-full h-full object-contain transition duration-300 group-hover:scale-[1.03]"
    />
  </div>
);

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useContext(WishlistContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [heartLoading, setHeartLoading] = useState(false);

  const inWishlist = isInWishlist(product._id);
  const hasMultiple = product.images?.length > 1;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock > 0) addToCart(product, 1);
  };

  const handleHeartClick = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (heartLoading) return;
    setHeartLoading(true);
    try {
      inWishlist ? await removeFromWishlist(product._id) : await addToWishlist(product._id);
    } catch (_) {}
    finally { setHeartLoading(false); }
  };

  return (
    <Link to={`/products/${product._id}`} className="group block">
      {/* Image area */}
      <div className="relative">
        {hasMultiple ? (
          <StackedImages images={product.images} name={product.name} />
        ) : (
          <SingleImage image={product.images[0]} name={product.name} />
        )}

        {/* Sold out overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl z-10">
            <span className="text-xs tracking-widest uppercase text-[#6B7280]">Sold Out</span>
          </div>
        )}

        {/* Low stock badge */}
        {product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 5) && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[9px] tracking-widest uppercase px-2 py-1 rounded-full bg-amber-50/90 text-amber-600 backdrop-blur-sm">
              Only {product.stock} left
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleHeartClick}
          disabled={heartLoading}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-[#1A1A1A] hover:bg-white transition duration-300 shadow-sm"
        >
          {inWishlist ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          )}
        </button>

        {/* Quick add — appears on hover */}
        {product.stock > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 left-3 right-3 z-10 py-2 bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-xs tracking-widest uppercase rounded-full opacity-0 group-hover:opacity-100 transition duration-300 hover:bg-white shadow-sm"
          >
            Add to Bag
          </button>
        )}
      </div>

      {/* Product info */}
      <div className="mt-3 px-0.5">
        <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-0.5">
          {product.category.replace(/-/g, ' ')}
        </p>
        <h3 className="text-sm text-[#1A1A1A] font-medium leading-snug truncate">{product.name}</h3>
        <p className="text-sm text-[#6B7280] mt-0.5">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
};

export default ProductCard;
