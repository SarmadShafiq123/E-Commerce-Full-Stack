import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, homepageAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import PageSEO from '../seo/PageSEO';
import { SITE_URL, SITE_DESCRIPTION } from '../seo/seoConfig';
import RecommendationCarousel from '../components/RecommendationCarousel';
import TopBar from '../components/TopBar';
import HeroSlider from '../components/HeroSlider';

const categories = [
  { name: 'Handbags',      value: 'handbags' },
  { name: 'Tote Bags',     value: 'tote-bags' },
  { name: 'Clutches',      value: 'clutches' },
  { name: 'Shoulder Bags', value: 'shoulder-bags' },
  { name: 'Crossbody',     value: 'crossbody' },
  { name: 'Wallets',       value: 'wallets' },
];

const Home = () => {
  const [products, setProducts]           = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Slider state — starts as loading (true), never null-flickers
  const [slides, setSlides]               = useState([]);
  const [topBar, setTopBar]               = useState(null);
  const [sliderLoading, setSliderLoading] = useState(true);

  useEffect(() => {
    // Products fetch
    productAPI.getProducts({ limit: 8, sort: 'newest' })
      .then(({ data }) => setProducts(data.data))
      .catch(console.error)
      .finally(() => setProductsLoading(false));

    // Homepage / slider fetch — only flip sliderLoading off when settled
    homepageAPI.getHomepage()
      .then(({ data }) => {
        setTopBar(data.topBar ?? null);
        setSlides(data.heroSlider ?? []);
      })
      .catch(() => setSlides([]))   // on error → empty state, not skeleton forever
      .finally(() => setSliderLoading(false));
  }, []);

  return (
    <div className="bg-[#FAFAFA]">
      <PageSEO
        title="Premium Luxury Bags — Handcrafted Leather Goods"
        description={SITE_DESCRIPTION}
        canonical={`${SITE_URL}/`}
      />

      {/* Top bar — only renders when active */}
      <TopBar topBar={topBar} />

      {/*
        Hero — three possible states, all at h-[60vh] so layout never shifts:
          1. sliderLoading=true  → HeroSkeleton (same fixed height)
          2. slides.length > 0   → live HeroSlider
          3. slides.length === 0 → HeroEmpty ("Slider content coming soon")
      */}
      <HeroSlider slides={slides} loading={sliderLoading} />

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-8">Browse by Category</p>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              to={`/products?category=${cat.value}`}
              className="px-5 py-2.5 rounded-full border border-[#EAEAEA] text-sm text-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition duration-300"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Just In</p>
            <h2 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">New Arrivals</h2>
          </div>
          <Link
            to="/products"
            className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300 hidden sm:block"
          >
            View All →
          </Link>
        </div>

        {productsLoading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center sm:hidden">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 border border-[#EAEAEA] text-sm text-[#1A1A1A] px-6 py-3 rounded-full hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition duration-300"
          >
            View All Products
          </Link>
        </div>
      </section>

      {/* AI Personalised Recommendations */}
      <RecommendationCarousel title="Picked For You" limit={8} />

      {/* Banner strip */}
      <section className="bg-[#1A1A1A] py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-3">Our Promise</p>
          <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mb-6">
            Crafted to Last a Lifetime
          </h2>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 border border-white/30 text-white text-xs tracking-widest uppercase px-7 py-3 rounded-full hover:bg-white hover:text-[#1A1A1A] transition duration-300"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
