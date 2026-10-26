import type { MetadataRoute } from 'next';

// CRM закрыта от поисковиков целиком.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
