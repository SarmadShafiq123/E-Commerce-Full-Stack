import { useEffect } from 'react';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from './seoConfig';

/**
 * Lightweight hook that writes meta tags directly to <head>.
 * Works without SSR — covers Google's JS-rendered crawling.
 *
 * @param {object} opts
 * @param {string}  opts.title        - Page title (appended with " | Luxe Bags")
 * @param {string}  [opts.description]
 * @param {string}  [opts.canonical]  - Full canonical URL
 * @param {string}  [opts.ogImage]
 * @param {string}  [opts.ogType]     - "website" | "product" (default "website")
 * @param {boolean} [opts.noIndex]    - true for private/admin pages
 */
const useSEO = ({
  title,
  description = SITE_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
} = {}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Premium Luxury Bags`;
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  useEffect(() => {
    // Title
    document.title = fullTitle;

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = selector.match(/\[(.+?)="(.+?)"\]/)?.slice(1) || [];
        if (attrName) el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };

    // Standard meta
    setMeta('meta[name="description"]',         'content', description);
    setMeta('meta[name="robots"]',              'content', noIndex ? 'noindex,nofollow' : 'index,follow');

    // Open Graph
    setMeta('meta[property="og:title"]',        'content', fullTitle);
    setMeta('meta[property="og:description"]',  'content', description);
    setMeta('meta[property="og:image"]',        'content', ogImage);
    setMeta('meta[property="og:url"]',          'content', canonicalUrl);
    setMeta('meta[property="og:type"]',         'content', ogType);
    setMeta('meta[property="og:site_name"]',    'content', SITE_NAME);

    // Twitter Card
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]',       'content', ogImage);

    // Canonical
    setLink('canonical', canonicalUrl);
  }, [fullTitle, description, canonicalUrl, ogImage, ogType, noIndex]);
};

export default useSEO;
