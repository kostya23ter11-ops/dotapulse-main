'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale } from '@/app/context/LocaleContext';
import { getWinrateColor } from '@/lib/constants';
import styles from './PopularHeroes.module.css';
import { RANK_TABS } from '@/lib/constants';
import type { HeroStats, HeroStatsByRank, RankTab } from '@/lib/types';

const RANKS: Record<RankTab, { icon: string | null }> = {
  all: { icon: null },
  1: { icon: '/ranks/rank_1.jpg' },
  2: { icon: '/ranks/rank_2.jpg' },
  3: { icon: '/ranks/rank_3.jpg' },
  4: { icon: '/ranks/rank_4.jpg' },
  5: { icon: '/ranks/rank_5.jpg' },
  6: { icon: '/ranks/rank_6.jpg' },
  7: { icon: '/ranks/rank_7.jpg' },
  8: { icon: '/ranks/rank_8.jpg' },
  pro: { icon: null },
};

const RANK_LABELS: Record<RankTab, { ru: string; en: string }> = {
  all: { ru: 'Все ранги', en: 'All Ranks' },
  1: { ru: 'Herald', en: 'Herald' },
  2: { ru: 'Guardian', en: 'Guardian' },
  3: { ru: 'Crusader', en: 'Crusader' },
  4: { ru: 'Archon', en: 'Archon' },
  5: { ru: 'Legend', en: 'Legend' },
  6: { ru: 'Ancient', en: 'Ancient' },
  7: { ru: 'Divine', en: 'Divine' },
  8: { ru: 'Immortal', en: 'Immortal' },
  pro: { ru: 'Про-сцена', en: 'Pro Scene' },
};

const PopularHeroes = ({ heroStats }: { heroStats: HeroStatsByRank }) => {
  const [activeTab, setActiveTab] = useState<RankTab>('all');
  const { locale } = useLocale();

  if (!heroStats || Object.keys(heroStats).length === 0) return null;

  const heroes = heroStats[activeTab] || heroStats.all || [];

  return (
    <section className={styles.heroesSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>{locale === 'en' ? 'Popular Heroes' : 'Популярные герои'}</h2>

        <div className={styles.tabs}>
          {RANK_TABS.map(key => {
            const rank = RANKS[key];
            const isActive = activeTab === key;
            const label = String(RANK_LABELS[key]?.[locale] || RANK_LABELS[key]?.ru || key);
            return (
              <button
                key={key}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(key)}
                title={label}
              >
                {rank.icon ? (
                  <img src={rank.icon} alt={label} className={styles.rankIcon} />
                ) : (
                  <span className={styles.rankTextIcon}>
                    {key === 'pro' ? '★' : 'ALL'}
                  </span>
                )}
                <span className={styles.tabLabel}>{label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.heroesGrid}>
          {heroes.map((hero: HeroStats) => (
            <div key={hero.id} className={styles.heroCard}>
              <div className={styles.imageWrapper}>
                {hero.image && (
                  <Image
                    src={hero.image}
                    alt={hero.name}
                    width={256}
                    height={144}
                    className={styles.heroImage}
                    priority={hero.id < 5}
                  />
                )}
              </div>
              <div className={styles.heroInfo}>
                <h3 className={styles.heroName}>{hero.name}</h3>
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Winrate</span>
                    <span className={styles.statValue} style={{ color: getWinrateColor(hero.winrateNum) }}>
                      {hero.winrate}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Picks</span>
                    <span className={styles.statValue}>{hero.pickrate?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularHeroes;
