import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/talent-pool/');

export default function Page() {
  return <PageFor route="/talent-pool/" />;
}