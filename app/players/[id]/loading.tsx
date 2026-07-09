import PageLayout from '@/app/components/PageLayout/PageLayout';
import SkeletonLoader from '@/app/components/SkeletonLoader/SkeletonLoader';

export default function Loading() {
  return (
    <PageLayout>
      <SkeletonLoader title="..." subtitle="..." rows={5} />
    </PageLayout>
  );
}
