import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** /industries/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/industries/').map((slug) => ({ slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/industries/${(await params).slug}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/industries/${(await params).slug}/`} />;
}