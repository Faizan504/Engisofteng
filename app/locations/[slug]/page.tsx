import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** /locations/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/locations/').map((slug) => ({ slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/locations/${(await params).slug}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/locations/${(await params).slug}/`} />;
}