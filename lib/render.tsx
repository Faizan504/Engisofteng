import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteShell from '@/components/SiteShell';
import { getPage } from './content';
import { pageMetadata } from './seo';

/** Metadata for a route (title, description, canonical, robots, Open Graph, Twitter). */
export function metadataFor(route: string): Metadata {
  const page = getPage(route);
  return page ? pageMetadata(page) : {};
}

/** The page for a route, or the 404 page. */
export function PageFor({ route }: { route: string }) {
  const page = getPage(route);
  if (!page) notFound();
  return <SiteShell route={route} main={page.main} cta={page.cta} jsonld={page.jsonld} caseStudy={page.caseStudy} />;
}