import type { Metadata, Viewport } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { site, SITE_URL } from '@/lib/content';

// cache-busting stamp per file: assets are cached for a year, so a changed file gets a new URL
const v = (rel: string) => {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(path.join(process.cwd(), 'public', rel))).digest('hex').slice(0, 10);
  } catch {
    return '1';
  }
};
const asset = (rel: string) => `/${rel}?v=${v(rel)}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'ENGISOFT Engineering',
  icons: { icon: [{ url: '/assets/img/favicon.svg', type: 'image/svg+xml' }] },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0B0B0C' };

// settings read by assets/js/main.js (asset paths, hero frames, the form endpoint, the email fallback)
const ESWP = { assets: '/assets/', seq: '/assets/seq/hero/', ajax: '/api/enquiry/', email: site.eswp.email || 'enquiry@engisoftengineering.com' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/assets/fonts/Manrope-normal-300-800.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/assets/fonts/InstrumentSerif-italic-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="stylesheet" href={asset('assets/css/style.css')} />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body suppressHydrationWarning>
        <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: site.sprite }} />
        {children}
        <script dangerouslySetInnerHTML={{ __html: `var ESWP = ${JSON.stringify(ESWP)};` }} />
        <script src={asset('assets/vendor/gsap.min.js')} defer />
        <script src={asset('assets/vendor/ScrollTrigger.min.js')} defer />
        <script src={asset('assets/vendor/lenis.min.js')} defer />
        <script src={asset('assets/js/bim.js')} defer />
        <script src={asset('assets/js/main.js')} defer />
      </body>
    </html>
  );
}