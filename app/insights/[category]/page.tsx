import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** Insights category: /insights/{category}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/insights/').map((category) => ({ category }));
}
type P = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/insights/${(await params).category}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/insights/${(await params).category}/`} />;
}