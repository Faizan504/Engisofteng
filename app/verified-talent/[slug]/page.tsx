import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** /verified-talent/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/verified-talent/').map((slug) => ({ slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/verified-talent/${(await params).slug}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/verified-talent/${(await params).slug}/`} />;
}