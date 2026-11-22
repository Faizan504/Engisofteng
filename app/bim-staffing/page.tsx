import { PageFor, metadataFor } from '@/lib/render';

export const metadata = metadataFor('/bim-staffing/');

export default function Page() {
  return <PageFor route="/bim-staffing/" />;
}