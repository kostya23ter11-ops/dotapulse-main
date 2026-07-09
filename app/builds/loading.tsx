import PageLayout from '@/app/components/PageLayout/PageLayout';
import SkeletonLoader from '@/app/components/SkeletonLoader/SkeletonLoader';
import { t } from '@/lib/i18n';

export default function Loading() {
  return (
    <PageLayout>
      <SkeletonLoader title={t('nav.builds')} subtitle={t('features.buildsDesc')} />
    </PageLayout>
  );
}
