import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** /talent-pool/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/talent-pool/').map((slug) => ({ slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/talent-pool/${(await params).slug}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/talent-pool/${(await params).slug}/`} />;
}