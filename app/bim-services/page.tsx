import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/bim-services/');

export default function Page() {
  return <PageFor route="/bim-services/" />;
}