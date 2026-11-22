import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/case-studies/');

export default function Page() {
  return <PageFor route="/case-studies/" />;
}