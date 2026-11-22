import type { NextConfig } from 'next';
import fs from 'node:fs';
import path from 'node:path';

// 301 redirects from the old engisoftengineering.com URLs (same map as the WordPress theme and .htaccess)
const site = JSON.parse(fs.readFileSync(path.join(__dirname, 'content', 'site.json'), 'utf8'));

const nextConfig: NextConfig = {
  trailingSlash: true, // URLs end in "/" exactly like the WordPress site (/bim-staffing/onsite/)
  poweredByHeader: false,
  async redirects() {
    return site.redirects;
  },
  async headers() {
    return [
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] },
    ];
  },
};

export default nextConfig;