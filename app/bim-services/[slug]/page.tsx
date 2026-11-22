import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** /bim-services/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/bim-services/').map((slug) => ({ slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/bim-services/${(await params).slug}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/bim-services/${(await params).slug}/`} />;
}