import PageLayout from '@/app/components/PageLayout/PageLayout';
import { getAllHeroStatsRaw, getProLeaderboard } from '@/lib/leaderboard';
import { t } from '@/lib/i18n';
import LeaderboardClient from './LeaderboardClient';
import styles from './Leaderboard.module.css';

export const revalidate = 600;

export default async function LeaderboardPage() {
  const [heroData, proData] = await Promise.all([
    getAllHeroStatsRaw(),
    getProLeaderboard(),
  ]);

  return (
    <PageLayout>
      <div className={styles.leaderboardContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('leaderboard.title')}</h1>
          <p className={styles.subtitle}>
            {t('leaderboard.heroRating', undefined, { heroCount: heroData.length, proCount: proData.length })}
          </p>
        </div>
        <LeaderboardClient heroData={heroData} proData={proData} />
      </div>
    </PageLayout>
  );
}
