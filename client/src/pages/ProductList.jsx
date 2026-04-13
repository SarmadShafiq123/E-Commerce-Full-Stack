import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import PageSEO from '../seo/PageSEO';
import { ItemListJsonLd } from '../seo/JsonLd';
import { SITE_URL, CATEGORY_META } from '../seo/seoConfig';

const categories = [
  { name: 'All', value: '' },
  { name: 'Handbags', value: 'handbags' },
  { name: 'Tote Bags', value: 'tote-bags' },
  { name: 'Clutches', value: 'clutches' },
  { name: 'Shoulder Bags', value: 'shoulder-bags' },
  { name: 'Crossbody', value: 'crossbody' },
  { name: 'Wallets', value: 'wallets' },
];

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    setLoading(true);
    const params = {
      page, limit: 12,
      ...(search && { search }),
      ...(category && { category }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      sort,
    };
    productAPI.getProducts(params)
      .then(({ data }) => {
        setProducts(data.data);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, category, minPrice, maxPrice, sort]);

  const clearFilters = () => {
    setCategory(''); setMinPrice(''); setMaxPrice(''); setSort('newest'); setPage(1);
    setSearchParams({});
  };

  const hasFilters = category || minPrice || maxPrice || sort !== 'newest';

  // SEO
  const catMeta   = CATEGORY_META[category] || {};
  const seoTitle  = catMeta.title || (search ? `Search: ${search}` : 'All Collections');
  const seoDesc   = catMeta.description || `Browse ${total} luxury bags. Filter by category, price and more.`;
  const canonical = `${SITE_URL}/products${category ? `?category=${category}` : ''}`;

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <PageSEO title={seoTitle} description={seoDesc} canonical={canonical} />
      <ItemListJsonLd products={products} category={catMeta.title} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Explore</p>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Collections</h1>
        </div>

        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search bags..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#EAEAEA] rounded-full text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-5 py-3 bg-white border border-[#EAEAEA] rounded-full text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition duration-300 cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-[#EAEAEA] rounded-full text-sm text-[#1A1A1A] hover:border-[#1A1A1A] transition duration-300 sm:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />}
          </button>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs tracking-wide transition duration-300 ${
                category === cat.value
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters — desktop */}
          <aside className="hidden sm:block w-52 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] tracking-widest uppercase text-[#1A1A1A]">Filters</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">
                    Clear
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs text-[#6B7280] mb-3 tracking-wide">Price Range</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#1A1A1A] transition duration-300"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile filters panel */}
          {filtersOpen && (
            <div className="sm:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setFiltersOpen(false)}>
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-medium text-[#1A1A1A]">Filters</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-[#6B7280]">Clear all</button>
                  )}
                </div>
                <p className="text-xs text-[#6B7280] mb-3">Price Range</p>
                <div className="flex gap-3 mb-6">
                  <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#EAEAEA] rounded-xl text-sm focus:outline-none focus:border-[#1A1A1A]" />
                  <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#EAEAEA] rounded-xl text-sm focus:outline-none focus:border-[#1A1A1A]" />
                </div>
                <button onClick={() => setFiltersOpen(false)}
                  className="w-full py-3 bg-[#1A1A1A] text-white text-sm rounded-full">
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6B7280] mb-6">{total} {total === 1 ? 'product' : 'products'}</p>

            {loading ? (
              <Spinner />
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[#6B7280] text-sm mb-4">No products found</p>
                <button onClick={clearFilters} className="text-xs tracking-widest uppercase text-[#1A1A1A] underline underline-offset-4">
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-full text-sm transition duration-300 ${
                          page === n
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-white border border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
