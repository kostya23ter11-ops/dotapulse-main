'use client';

import { useState } from 'react';
import { useLocale } from '@/app/context/LocaleContext';
import { getWinrateColor } from '@/lib/constants';
import type { PlayerHero, PlayerMatch } from '@/lib/types';
import styles from './PlayerProfile.module.css';

const TABS = ['overview', 'heroes', 'matches'] as const;
type TabId = (typeof TABS)[number];

const GAME_MODES = {
  0: 'All Pick', 1: 'Captains Mode', 2: 'Random Draft', 3: 'Single Draft',
  4: 'All Random', 5: 'Intro', 6: 'Diretide', 7: 'Reverse Captains Mode',
  8: 'Greeviling', 9: 'Tutorial', 10: 'Mid Only', 11: 'Least Played',
  12: 'Limited Heroes', 13: 'Compendium Matchmaking', 14: 'Custom',
  15: 'Captains Draft', 16: 'Balanced Draft', 17: 'Ability Draft',
  18: 'Event', 19: 'All Random Death Match', 20: '1v1 Mid', 21: 'All Draft',
  22: 'Turbo', 23: 'Mutation',
};

function formatTimeAgo(timestamp: number, t: (key: string) => string) {
  if (!timestamp) return '';
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return t('player.justNow');
  if (diff < 3600) return `${Math.floor(diff / 60)}${t('player.minutesAgo')}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}${t('player.hoursAgo')}`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `${days}${t('player.daysAgo')}`;
  return `${Math.floor(days / 30)}${t('player.monthsAgo')}`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function MatchRow({ match, t }: { match: PlayerMatch; t: (key: string) => string }) {
  const won = (match.player_slot < 128) === match.radiant_win;
  const gpm = match.gold_per_min || 0;
  const xpm = match.xp_per_min || 0;
  const dmg = match.hero_damage || 0;

  return (
    <div className={styles.matchRow}>
      <div className={`${styles.matchStatus} ${won ? styles.matchWin : styles.matchLoss}`}>
        {won ? 'W' : 'L'}
      </div>
      <div className={styles.matchInfo}>
        <span className={styles.matchHero}>{match.hero_name}</span>
        <span className={styles.matchKda}>
          {match.kills}/{match.deaths}/{match.assists}
        </span>
        <span className={styles.matchStat}>{formatDuration(match.duration)}</span>
        <span className={styles.matchStat}>{gpm}</span>
        <span className={styles.matchStat}>{xpm}</span>
        <span className={styles.matchStat}>{(dmg / 1000).toFixed(1)}k</span>
        <span className={styles.matchTime}>{formatTimeAgo(match.start_time, t)}</span>
      </div>
    </div>
  );
}

function HeroRow({ hero, gamesLabel }: { hero: PlayerHero; gamesLabel: string }) {
  const wr = parseFloat(hero.winrate);
  const color = getWinrateColor(parseFloat(hero.winrate));

  return (
    <div className={styles.heroRow}>
      <div className={styles.heroRowImage}>
        <img src={hero.image} alt={hero.hero_name} width={58} height={33} />
      </div>
      <div className={styles.heroRowInfo}>
        <span className={styles.heroRowName}>{hero.hero_name}</span>
        <span className={styles.heroRowGames}>{hero.games}{gamesLabel}</span>
      </div>
      <div className={styles.heroRowStats}>
        <span className={styles.heroRowWinrate} style={{ color }}>
          {hero.winrate}%
        </span>
        <span className={styles.heroRowWinloss}>
          {hero.win}W / {hero.games - hero.win}L
        </span>
      </div>
    </div>
  );
}

interface ProfileClientProps {
  matches: PlayerMatch[];
  heroes: PlayerHero[];
  topHeroes: PlayerHero[];
  totalGames: number;
}

export default function ProfileClient({ matches, heroes, topHeroes }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { t } = useLocale();

  const tabLabels: Record<TabId, string> = {
    overview: t('player.overview'),
    heroes: t('player.heroesTab'),
    matches: t('player.matchesTab'),
  };

  return (
    <div className={styles.profileClient}>
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className={styles.tabContent}>
          {topHeroes.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('player.topHeroes')}</h3>
              <div className={styles.heroesList}>
                {topHeroes.map(h => (
                  <HeroRow key={h.hero_id} hero={h} gamesLabel={t('player.games')} />
                ))}
              </div>
            </div>
          )}

          {matches.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('player.recentMatches')}</h3>
              <div className={styles.matchHeaders}>
                <span></span>
                <div className={styles.matchHeaderLabels}>
                  <span>{t('player.hero')}</span>
                  <span>KDA</span>
                  <span>{t('player.time')}</span>
                  <span>GPM</span>
                  <span>XPM</span>
                  <span>{t('player.damage')}</span>
                  <span></span>
                </div>
              </div>
              <div className={styles.matchesList}>
                {matches.slice(0, 5).map(m => (
                  <MatchRow key={m.match_id} match={m} t={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'heroes' && (
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('player.allHeroes')} ({heroes.length})</h3>
            <div className={styles.heroesList}>
              {heroes.map(h => (
                <HeroRow key={h.hero_id} hero={h} gamesLabel={t('player.games')} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{matches.length} {t('player.matchesTab').toLowerCase()}</h3>
            <div className={styles.matchHeaders}>
              <span></span>
              <div className={styles.matchHeaderLabels}>
                <span>{t('player.hero')}</span>
                <span>KDA</span>
                <span>{t('player.time')}</span>
                <span>GPM</span>
                <span>XPM</span>
                <span>{t('player.damage')}</span>
                <span></span>
              </div>
            </div>
            <div className={styles.matchesList}>
              {matches.map(m => (
                <MatchRow key={m.match_id} match={m} t={t} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
