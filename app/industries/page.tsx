import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/industries/');

export default function Page() {
  return <PageFor route="/industries/" />;
}