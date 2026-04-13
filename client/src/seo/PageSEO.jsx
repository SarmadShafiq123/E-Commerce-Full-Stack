import { Helmet } from 'react-helmet-async';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from './seoConfig';

/**
 * Drop-in SEO component using react-helmet-async.
 * Renders all meta, OG, Twitter, and canonical tags.
 *
 * Props:
 *   title       — page title (will be suffixed with "| Luxe Bags")
 *   description — meta description
 *   canonical   — full canonical URL (defaults to current href)
 *   ogImage     — OG image URL
 *   ogType      — "website" | "product"
 *   noIndex     — true for admin/private pages
 *   children    — extra <script> or <link> tags (e.g. JSON-LD)
 */
const PageSEO = ({
  title,
  description = SITE_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  children,
}) => {
  const fullTitle    = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Premium Luxury Bags`;
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description"        content={description} />
      <meta name="robots"             content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <link rel="canonical"           href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:site_name"   content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage} />

      {children}
    </Helmet>
  );
};

export default PageSEO;
