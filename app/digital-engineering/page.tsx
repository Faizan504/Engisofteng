import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/digital-engineering/');

export default function Page() {
  return <PageFor route="/digital-engineering/" />;
}