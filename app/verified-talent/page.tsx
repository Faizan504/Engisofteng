import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/verified-talent/');

export default function Page() {
  return <PageFor route="/verified-talent/" />;
}