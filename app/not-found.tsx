import type { Metadata } from 'next';
import SiteShell from '@/components/SiteShell';
import { site } from '@/lib/content';

export const metadata: Metadata = { title: { absolute: site.notFound.title || 'Page not found | ENGISOFT Engineering' }, robots: { index: false, follow: true } };

export default function NotFound() {
  return <SiteShell route="/404/" main={site.notFound.main} cta={site.notFound.cta} />;
}