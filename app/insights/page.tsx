import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/insights/');

export default function Page() {
  return <PageFor route="/insights/" />;
}