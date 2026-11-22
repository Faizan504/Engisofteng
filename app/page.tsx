import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/');

export default function Home() {
  return <PageFor route="/" />;
}