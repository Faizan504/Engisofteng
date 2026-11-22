import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/locations/');

export default function Page() {
  return <PageFor route="/locations/" />;
}