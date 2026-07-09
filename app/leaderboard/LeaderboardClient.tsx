'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './Leaderboard.module.css';
import { RANK_TABS, getWinrateColor } from '@/lib/constants';
import type { LeaderboardHeroRaw, ProPlayer, RankTab } from '@/lib/types';

const ROLE_NAMES: Record<number, string> = { 1: 'Carry', 2: 'Mid', 3: 'Offlane', 4: 'Soft Sup', 5: 'Hard Sup' };
const RANK_LABELS: Record<RankTab, string> = {
  all: 'All',
  1: 'Herald', 2: 'Guardian', 3: 'Crusader', 4: 'Archon',
  5: 'Legend', 6: 'Ancient', 7: 'Divine', 8: 'Immortal',
  pro: 'Pro',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function WinrateCell({ value }: { value: number }) {
  const color = getWinrateColor(value);
  return <span style={{ color }}>{value}%</span>;
}

interface LeaderboardClientProps {
  heroData: LeaderboardHeroRaw[];
  proData: ProPlayer[];
}

export default function LeaderboardClient({ heroData, proData }: LeaderboardClientProps) {
  const [mainTab, setMainTab] = useState<'heroes' | 'players'>('heroes');
  const [rankTab, setRankTab] = useState<RankTab>('pro');
  const [sortBy, setSortBy] = useState('winrate');
  const [search, setSearch] = useState('');
  const { t } = useLocale();

  const filteredHeroes = useMemo(() => {
    const withStats = heroData.map(h => {
      let picks, wins;
      if (rankTab === 'all') {
        picks = 0;
        wins = 0;
        for (let r = 1; r <= 7; r++) {
          picks += h.raw?.[`${r}_pick`] || 0;
          wins += h.raw?.[`${r}_win`] || 0;
        }
      } else {
        const pickKey = `${rankTab}_pick`;
        const winKey = `${rankTab}_win`;
        picks = h.raw?.[pickKey] || 0;
        wins = h.raw?.[winKey] || 0;
      }
      const wr = picks > 0 ? parseFloat(((wins / picks) * 100).toFixed(1)) : 0;
      return { ...h, winrate: wr, picks };
    });

    const sorted = withStats.sort((a, b) => {
      if (sortBy === 'picks') return b.picks - a.picks;
      return b.winrate - a.winrate;
    });

    if (!search) return sorted;
    return sorted.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
  }, [heroData, rankTab, sortBy, search]);

  const filteredPlayers = useMemo(() => {
    let list = proData;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q)
      );
    }
    return list;
  }, [proData, search]);

  return (
    <>
      <div className={styles.mainTabs}>
        <button
          className={`${styles.mainTab} ${mainTab === 'heroes' ? styles.mainTabActive : ''}`}
          onClick={() => setMainTab('heroes')}
        >
          {t('leaderboard.heroes')}
        </button>
        <button
          className={`${styles.mainTab} ${mainTab === 'players' ? styles.mainTabActive : ''}`}
          onClick={() => setMainTab('players')}
        >
          {t('leaderboard.players')}
        </button>
      </div>

      {mainTab === 'heroes' && (
        <>
          <div className={styles.rankTabs}>
            {RANK_TABS.map(key => (
              <button
                key={key}
                className={`${styles.rankTab} ${rankTab === key ? styles.rankTabActive : ''}`}
                onClick={() => setRankTab(key)}
              >
                {key === 'all' ? t('leaderboard.all') : RANK_LABELS[key]}
              </button>
            ))}
          </div>

          <div className={styles.filters}>
            <input
              type="text"
              placeholder={t('leaderboard.searchHero')}
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className={`${styles.sortBtn} ${sortBy === 'winrate' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortBy('winrate')}
            >
              Winrate
            </button>
            <button
              className={`${styles.sortBtn} ${sortBy === 'picks' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortBy('picks')}
            >
              Picks
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.lbTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('leaderboard.hero')}</th>
                  <th onClick={() => setSortBy('winrate')}>Winrate</th>
                  <th onClick={() => setSortBy('picks')}>Picks</th>
                  <th>{t('leaderboard.roles')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHeroes.map((hero, i) => (
                  <tr key={hero.id} className={styles.tableRow}>
                    <td className={styles.indexCell}>{i + 1}</td>
                    <td>
                      <div className={styles.heroCell}>
                        <div className={styles.heroIcon}>
                          <img src={hero.image} alt={hero.name} loading="lazy" />
                        </div>
                        <span className={styles.heroName}>{hero.name}</span>
                      </div>
                    </td>
                    <td><WinrateCell value={hero.winrate} /></td>
                    <td className={styles.picksCell}>{hero.picks?.toLocaleString()}</td>
                    <td>
                      {hero.roles?.slice(0, 2).map(r => (
                        <span key={r} className={styles.roleBadge}>{r}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mainTab === 'players' && (
        <>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder={t('leaderboard.searchPlayer')}
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.lbTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('leaderboard.player')}</th>
                  <th>{t('leaderboard.team')}</th>
                  <th>{t('leaderboard.role')}</th>
                  <th>{t('leaderboard.region')}</th>
                  <th>{t('leaderboard.lastMatch')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, i) => (
                  <tr key={player.id + '-' + i} className={styles.tableRow}>
                    <td className={styles.indexCell}>{i + 1}</td>
                    <td>
                      <div className={styles.playerCell}>
                        <div className={styles.playerAvatar}>
                          <img src={player.avatar} alt={player.name} loading="lazy" />
                        </div>
                        <Link
                          href={`/players/${player.id}`}
                          className={styles.playerName}
                        >
                          {player.name}
                        </Link>
                      </div>
                    </td>
                    <td className={styles.teamCell}>{player.team}</td>
                    <td>
                      {player.role > 0 && (
                        <span className={styles.roleBadge}>{ROLE_NAMES[player.role]}</span>
                      )}
                    </td>
                    <td className={styles.countryCell}>{player.country || '—'}</td>
                    <td className={styles.dateCell}>{formatDate(player.lastMatch)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {((mainTab === 'heroes' && filteredHeroes.length === 0) ||
        (mainTab === 'players' && filteredPlayers.length === 0)) && (
        <div className={styles.emptyState}>{t('leaderboard.empty')}</div>
      )}
    </>
  );
}
