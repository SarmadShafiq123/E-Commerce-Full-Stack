export const SITE_NAME = 'Luxe Bags';
export const SITE_URL  = import.meta.env.VITE_SITE_URL || 'https://luxebags.store';
export const SITE_DESCRIPTION =
  'Discover handcrafted luxury bags — handbags, tote bags, clutches, shoulder bags and more. Premium leather goods crafted for the discerning collector.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
export const TWITTER_HANDLE   = '@luxebags';

export const CATEGORY_META = {
  handbags:      { title: 'Luxury Handbags',      description: 'Shop our collection of premium handcrafted handbags. Timeless designs in the finest leather.' },
  'tote-bags':   { title: 'Designer Tote Bags',   description: 'Elegant tote bags for every occasion. Spacious, stylish and crafted to last.' },
  clutches:      { title: 'Evening Clutches',      description: 'Sophisticated clutch bags for special occasions. Compact luxury at its finest.' },
  'shoulder-bags': { title: 'Shoulder Bags',       description: 'Versatile shoulder bags combining style and practicality in premium leather.' },
  crossbody:     { title: 'Crossbody Bags',        description: 'Hands-free luxury crossbody bags. Perfect for everyday elegance.' },
  wallets:       { title: 'Luxury Wallets',        description: 'Fine leather wallets and cardholders. Small accessories, big statement.' },
};
