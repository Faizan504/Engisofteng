import { PageFor, metadataFor } from '@/lib/render';
import { routes, SECTIONS } from '@/lib/content';

/** Top-level pages: /about/, /why-engisoft/, /contact/, /request-talent/ ... */
export const dynamicParams = false;
export function generateStaticParams() {
  return routes
    .map((r) => r.route.split('/').filter(Boolean))
    .filter((s) => s.length === 1 && !SECTIONS.includes(s[0]))
    .map((s) => ({ page: s[0] }));
}
type P = { params: Promise<{ page: string }> };
export async function generateMetadata({ params }: P) {
  return metadataFor(`/${(await params).page}/`);
}
export default async function Page({ params }: P) {
  return <PageFor route={`/${(await params).page}/`} />;
}