import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';

const RecommendationCarousel = ({ title = 'Recommended For You', limit = 8 }) => {
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    aiAPI.getRecommendations({ limit })
      .then(({ data }) => setProducts(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, limit]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  if (!user || (!loading && products.length === 0)) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">AI Picks</p>
          <h2 className="text-2xl font-light text-[#1A1A1A] tracking-tight">{title}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} aria-label="Scroll left"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#EAEAEA] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition duration-300">
            ←
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll right"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#EAEAEA] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition duration-300">
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-52 rounded-2xl bg-[#F5F5F5] animate-pulse" style={{ height: 280 }} />
          ))}
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {products.map((product) => {
            const now = new Date();
            const offerActive = product.offerPrice && product.offerStart && product.offerEnd &&
              now >= new Date(product.offerStart) && now <= new Date(product.offerEnd);
            const displayPrice = offerActive ? product.offerPrice : product.price;

            return (
              <Link key={product._id} to={`/products/${product._id}`}
                className="group shrink-0 w-52 block">
                <div className="relative rounded-2xl overflow-hidden bg-[#F5F5F5] aspect-[3/4] mb-3">
                  <img
                    src={product.images?.[0]?.url || '/placeholder.jpg'}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  {offerActive && (
                    <span className="absolute top-2 left-2 text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-400 text-white font-medium">
                      Sale
                    </span>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
                      <span className="text-[10px] tracking-widest uppercase text-[#6B7280]">Sold Out</span>
                    </div>
                  )}
                  {product.stock > 0 && (
                    <button
                      onClick={(e) => { e.preventDefault(); addToCart(product, 1); }}
                      className="absolute bottom-2 left-2 right-2 py-1.5 bg-white/90 backdrop-blur-sm text-[#1A1A1A] text-[10px] tracking-widest uppercase rounded-full opacity-0 group-hover:opacity-100 transition duration-300"
                    >
                      Add to Bag
                    </button>
                  )}
                </div>
                <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-0.5">
                  {product.category?.replace(/-/g, ' ')}
                </p>
                <p className="text-sm text-[#1A1A1A] font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={`text-sm ${offerActive ? 'text-amber-600' : 'text-[#6B7280]'}`}>
                    {formatPrice(displayPrice)}
                  </p>
                  {offerActive && (
                    <p className="text-xs text-[#9CA3AF] line-through">{formatPrice(product.price)}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecommendationCarousel;
