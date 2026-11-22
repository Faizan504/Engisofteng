import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** /digital-engineering/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/digital-engineering/').map((slug) => ({ slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/digital-engineering/${(await params).slug}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/digital-engineering/${(await params).slug}/`} />;
}