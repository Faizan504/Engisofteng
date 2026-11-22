import { PageFor, metadataFor } from '@/lib/render';
import { childSlugs } from '@/lib/content';

/** /engineering-staffing/{slug}/ */
export const dynamicParams = false;
export function generateStaticParams() {
  return childSlugs('/engineering-staffing/').map((slug) => ({ slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/engineering-staffing/${(await params).slug}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/engineering-staffing/${(await params).slug}/`} />;
}