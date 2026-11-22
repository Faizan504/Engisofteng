import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/engineering-staffing/');

export default function Page() {
  return <PageFor route="/engineering-staffing/" />;
}