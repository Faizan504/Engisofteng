import type { Metadata } from 'next';
import type { Page } from './content';

/** On-page SEO from the content file: title, description, canonical, robots, Open Graph, Twitter. */
export function pageMetadata(page: Page): Metadata {
  const noindex = /noindex/.test(page.robots);
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.canonical || undefined },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: (page.og.type as 'website' | 'article') || 'website',
      title: page.og.title || page.title,
      description: page.og.description || page.description,
      url: page.og.url || page.canonical,
      siteName: page.og.siteName || 'ENGISOFT Engineering',
      locale: page.og.locale || 'en_US',
      images: page.og.image ? [{ url: page.og.image }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}