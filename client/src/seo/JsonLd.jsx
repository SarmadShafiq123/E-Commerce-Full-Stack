import { Helmet } from 'react-helmet-async';
import { SITE_NAME, SITE_URL } from './seoConfig';

/**
 * Injects a JSON-LD <script> block into <head>.
 * Pass any valid schema.org object as `schema` prop.
 */
export const JsonLd = ({ schema }) => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  </Helmet>
);

// ── Pre-built schemas ─────────────────────────────────────────────────────────

/**
 * Product schema for Google rich snippets.
 * https://schema.org/Product
 */
export const ProductJsonLd = ({ product }) => {
  if (!product) return null;

  const availability = product.stock > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map((img) => img.url) || [],
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: product.category?.replace(/-/g, ' '),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: product.price,
      availability,
      url: `${SITE_URL}/products/${product._id}`,
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  };

  return <JsonLd schema={schema} />;
};

/**
 * BreadcrumbList schema.
 * items = [{ name, url }]
 */
export const BreadcrumbJsonLd = ({ items }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return <JsonLd schema={schema} />;
};

/**
 * Organization schema — injected on every page via App.
 */
export const OrganizationJsonLd = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
    },
  };
  return <JsonLd schema={schema} />;
};

/**
 * WebSite schema with SearchAction for Google Sitelinks Search Box.
 */
export const WebSiteJsonLd = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/products?search={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
  return <JsonLd schema={schema} />;
};

/**
 * ItemList schema for category / product listing pages.
 */
export const ItemListJsonLd = ({ products = [], category }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category ? `${category} — ${SITE_NAME}` : `All Products — ${SITE_NAME}`,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/products/${p._id}`,
      name: p.name,
    })),
  };
  return <JsonLd schema={schema} />;
};
