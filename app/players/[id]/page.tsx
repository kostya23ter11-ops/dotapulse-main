import Image from 'next/image';
import { getPlayerData, getPlayerWL, getPlayerRecentMatches, getPlayerHeroes } from '@/lib/api';
import { t } from '@/lib/i18n';
import styles from './PlayerProfile.module.css';
import PageLayout from '@/app/components/PageLayout/PageLayout';
import ProfileClient from './ProfileClient';

const getRankName = (tier: number | null) => {
  if (!tier) return 'Unknown';
  const ranks = ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
  const firstDigit = Math.floor(tier / 10);
  return ranks[firstDigit - 1] || 'Unknown';
};

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const [player, wl, matches, heroes] = await Promise.all([
    getPlayerData(id),
    getPlayerWL(id),
    getPlayerRecentMatches(id),
    getPlayerHeroes(id),
  ]);

  if (!player) {
    return (
      <PageLayout>
        <div className={styles.errorContainer}>
          <h1 style={{color: 'white', marginTop: '100px'}}>{t('player.notFound')}</h1>
          <p style={{color: '#aaa'}}>{t('player.notFoundDesc')}</p>
        </div>
      </PageLayout>
    );
  }

  const totalGames = wl ? wl.win + wl.lose : 0;
  const winrate = totalGames > 0 ? ((wl.win / totalGames) * 100).toFixed(1) : '0.0';

  const totalKills = matches.reduce((s, m) => s + m.kills, 0);
  const totalDeaths = matches.reduce((s, m) => s + m.deaths, 0);
  const totalAssists = matches.reduce((s, m) => s + m.assists, 0);
  const avgKda = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : (totalKills + totalAssists).toFixed(2);

  const topHeroes = heroes.slice(0, 5);

  return (
    <PageLayout>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <Image
              src={player.avatar?.replace('http://', 'https://')}
              alt={player.name}
              width={150}
              height={150}
              className={styles.avatar}
            />
          </div>

          <div className={styles.playerInfo}>
            <h1 className={styles.playerName}>{player.name}</h1>
            <div className={styles.rankInfo}>
              <span className={styles.rankText}>
                {t('player.rank')}: {getRankName(player.rank_tier)}
                {player.leaderboard_rank && ` (Top ${player.leaderboard_rank})`}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('player.wins')}</span>
            <span className={`${styles.statValue} ${styles.win}`}>{wl?.win || 0}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('player.losses')}</span>
            <span className={`${styles.statValue} ${styles.loss}`}>{wl?.lose || 0}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('player.winrate')}</span>
            <span className={styles.statValue}>{winrate}%</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('player.totalGames')}</span>
            <span className={styles.statValue}>{totalGames.toLocaleString()}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('player.avgKda')}</span>
            <span className={styles.statValue}>{avgKda}</span>
          </div>
        </div>

        <ProfileClient
          matches={matches}
          heroes={heroes}
          topHeroes={topHeroes}
          totalGames={totalGames}
        />

        {(!wl || (wl.win === 0 && wl.lose === 0)) && (
          <div className={styles.privacyWarning}>
            <h3>{t('player.privacyWarning')}</h3>
            <p>{t('player.privacyDesc')}</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
