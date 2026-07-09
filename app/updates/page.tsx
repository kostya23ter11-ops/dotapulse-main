import PageLayout from '@/app/components/PageLayout/PageLayout';
import { getRecentPatches } from '@/lib/api';
import UpdatesClient from './UpdatesClient';

export default async function UpdatesPage() {
  const patches = await getRecentPatches();

  return (
    <PageLayout>
      <UpdatesClient patches={patches} />
    </PageLayout>
  );
}
