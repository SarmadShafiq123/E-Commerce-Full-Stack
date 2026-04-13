import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productAPI } from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import { formatPrice } from '../utils/formatPrice';
import { getWhatsAppOrderURL } from '../utils/whatsapp';
import Spinner from '../components/Spinner';
import PageSEO from '../seo/PageSEO';
import { ProductJsonLd, BreadcrumbJsonLd } from '../seo/JsonLd';
import { SITE_URL } from '../seo/seoConfig';
import ProductReviews from '../components/ProductReviews';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useContext(WishlistContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [heartLoading, setHeartLoading] = useState(false);

  useEffect(() => {
    productAPI.getProductById(id)
      .then(({ data }) => setProduct(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleHeartClick = async () => {
    if (!user) { navigate('/login', { state: { from: location.pathname } }); return; }
    if (heartLoading) return;
    setHeartLoading(true);
    try {
      isInWishlist(product._id)
        ? await removeFromWishlist(product._id)
        : await addToWishlist(product._id);
    } finally {
      setHeartLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-[#6B7280]">Product not found.</p>
      </div>
    );
  }

  const inWishlist = isInWishlist(product._id);
  const productUrl = `${SITE_URL}/products/${product._id}`;
  const ogImage = product.images[0]?.url;
  const catLabel = product.category.replace(/-/g, ' ');
  const metaDesc =
    product.description.length > 155
      ? product.description.slice(0, 152) + '...'
      : product.description;

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <PageSEO
        title={`${product.name} — ${catLabel}`}
        description={metaDesc}
        canonical={productUrl}
        ogImage={ogImage}
        ogType="product"
      />

      <ProductJsonLd product={product} />

      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Collections', url: `${SITE_URL}/products` },
          { name: catLabel, url: `${SITE_URL}/products?category=${product.category}` },
          { name: product.name, url: productUrl },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Images */}
          <div className="space-y-3 flex justify-center">
            <div className="w-[80%] rounded-2xl overflow-hidden bg-[#F5F5F5] aspect-[4/5]">
              <img
                src={product.images[selectedImage]?.url || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition duration-300 ${
                      selectedImage === i
                        ? 'border-[#1A1A1A]'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-3">
              {catLabel}
            </p>

            <div className="flex justify-between items-start gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A]">
                {product.name}
              </h1>

              <button
                onClick={handleHeartClick}
                disabled={heartLoading}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-[#EAEAEA]"
              >
                {inWishlist ? '♥' : '♡'}
              </button>
            </div>

            <p className="text-2xl font-light mb-2">
              {formatPrice(product.price)}
            </p>

            <p className="text-sm text-[#6B7280] mb-8">
              {product.description}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 rounded-full bg-[#1A1A1A] text-white"
              >
                Add to Bag
              </button>

              {import.meta.env.VITE_WHATSAPP_NUMBER && (
                <a
                  href={getWhatsAppOrderURL({
                    productName: product.name,
                    price: product.price,
                    quantity,
                    productUrl: window.location.href,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-full border text-center"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductReviews productId={product._id} />
    </div>
  );
};

export default ProductDetail;