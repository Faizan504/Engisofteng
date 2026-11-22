import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** /case-studies/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/case-studies/').map((slug) => ({ slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/case-studies/${(await params).slug}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/case-studies/${(await params).slug}/`} />;
}