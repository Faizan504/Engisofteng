import type { MetadataRoute } from 'next';
import { routes, SITE_URL } from '@/lib/content';

/** XML sitemap of every canonical public URL (same list as the WordPress sitemap). */
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({ url: SITE_URL + r.route, lastModified: r.lastmod }));
}