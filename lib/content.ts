import fs from 'node:fs';
import path from 'node:path';

/** Production domain used in canonical URLs, Open Graph, JSON-LD and the sitemap. */
export const SITE_URL = 'https://engisoftengineering.com';

export type Page = {
  route: string;
  title: string;
  description: string;
  robots: string;
  canonical: string;
  og: { type?: string; title?: string; description?: string; url?: string; image?: string; siteName?: string; locale?: string };
  twitter: string;
  jsonld: unknown[];
  caseStudy: boolean;
  main: string;
  cta: string;
};
export type MenuItem = { label: string; href: string; columns?: { heading: string; links: { label: string; href: string }[] }[] };
export type Site = {
  menu: MenuItem[];
  sprite: string;
  footGrid: string;
  legal: string;
  ctaButtons: string;
  eswp: Record<string, string>;
  notFound: { title: string; main: string; cta: string };
  redirects: { source: string; destination: string; permanent: boolean }[];
};

const DIR = path.join(process.cwd(), 'content');
const read = <T,>(f: string): T => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as T;

export const site = read<Site>('site.json');
export const routes = read<{ route: string; lastmod: string }[]>('routes.json');

/** Content of one page by its URL ("/", "/bim-staffing/onsite/"), or null. */
export function getPage(route: string): Page | null {
  const rel = route === '/' ? 'index' : route.replace(/^\/|\/$/g, '');
  const file = path.join(DIR, 'pages', rel + '.json');
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Page) : null;
}

/** Last URL segment of every page directly under a prefix ("/locations/" -> ["uae", "dubai", ...]). */
export function childSlugs(prefix: string): string[] {
  return routes
    .map((r) => r.route)
    .filter((r) => r.startsWith(prefix) && r !== prefix && r.slice(prefix.length).split('/').filter(Boolean).length === 1)
    .map((r) => r.slice(prefix.length).replace(/\/$/, ''));
}

/** Section folders that have their own route folder in app/. */
export const SECTIONS = ['bim-staffing', 'engineering-staffing', 'bim-services', 'case-studies', 'industries', 'locations', 'talent-pool', 'verified-talent', 'digital-engineering', 'insights'];