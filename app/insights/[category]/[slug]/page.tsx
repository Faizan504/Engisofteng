import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** Insights article: /insights/{category}/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/insights/').flatMap((category) => childSlugs(`/insights/${category}/`).map((slug) => ({ category, slug })));
}
type P = { params: Promise<{ category: string; slug: string }> };
export async function generateMetadata({ params }: P) {
  const p = await params;
  return metadataFor(`/insights/${p.category}/${p.slug}/`);
}
export default async function Page({ params }: P) {
  const p = await params;
  return <PageFor route={`/insights/${p.category}/${p.slug}/`} />;
}