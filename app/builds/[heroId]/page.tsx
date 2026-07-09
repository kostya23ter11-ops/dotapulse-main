import Link from 'next/link';
import PageLayout from '@/app/components/PageLayout/PageLayout';
import { getBuildsForHero } from '@/lib/builds';
import { getHeroStatsById } from '@/lib/api';
import { t } from '@/lib/i18n';
import HeroBuildClient from './HeroBuildClient';

export const revalidate = 600;

export default async function HeroBuildPage({ params }: { params: Promise<{ heroId: string }> }) {
  const { heroId } = await params;
  const heroData = getBuildsForHero(Number(heroId));

  if (!heroData) {
    return (
      <PageLayout>
        <div style={{ padding: '120px 20px 60px', textAlign: 'center', color: 'white' }}>
          <div style={{ padding: '80px 20px' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#888', marginBottom: 12 }}>{t('builds.heroNotFound')}</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>{t('builds.buildNotFound')}</p>
            <Link href="/builds" style={{ color: '#ff4c4c', textDecoration: 'none' }}>{t('builds.backToBuilds')}</Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const heroStats = await getHeroStatsById(heroId);

  return (
    <PageLayout>
      <HeroBuildClient
        hero={heroData}
        heroStats={heroStats}
        builds={heroData.builds}
      />
    </PageLayout>
  );
}
