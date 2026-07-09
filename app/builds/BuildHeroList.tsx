'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './Builds.module.css';
import type { BuildHeroSummary } from '@/lib/types';

const ROLES = ['All', 'Carry', 'Support', 'Nuker', 'Disabler', 'Initiator', 'Durable', 'Escape'];

function getWinrateClass(wr: number, s: typeof styles) {
  if (wr >= 53) return s.green;
  if (wr >= 50) return s.yellow;
  return s.red;
}

export default function BuildHeroList({ heroes = [] }: { heroes?: BuildHeroSummary[] }) {
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('All');
  const { t, locale } = useLocale();

  const filtered = useMemo(() => {
    return heroes.filter(h => {
      const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase());
      const matchRole = activeRole === 'All' || h.roles.includes(activeRole);
      return matchSearch && matchRole;
    });
  }, [heroes, search, activeRole]);

  return (
    <>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder={t('builds.search')}
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.roleFilters}>
          {ROLES.map(role => (
            <button
              key={role}
              className={`${styles.roleBtn} ${activeRole === role ? styles.activeRole : ''}`}
              onClick={() => setActiveRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>{locale === 'en' ? 'No heroes found' : 'Герои не найдены'}</div>
      ) : (
        <div className={styles.heroGrid}>
          {filtered.map(hero => (
            <Link key={hero.id} href={`/builds/${hero.id}`} className={styles.heroCard}>
              <div className={styles.heroImageWrapper}>
                {hero.image && (
                  <Image
                    src={hero.image}
                    alt={hero.name}
                    width={280}
                    height={158}
                    className={styles.heroImage}
                  />
                )}
              </div>
              <div className={styles.heroInfo}>
                <h3 className={styles.heroName}>{hero.name}</h3>
                <span className={styles.heroLane}>{hero.lane}</span>
                <div className={styles.heroStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Winrate</span>
                    <span className={`${styles.statValue} ${getWinrateClass(hero.winrate, styles)}`}>
                      {hero.winrate}%
                    </span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Builds</span>
                    <span className={styles.statValue}>{hero.buildCount}</span>
                  </div>
                </div>
                <div className={styles.heroRoles}>
                  {hero.roles.slice(0, 3).map(r => (
                    <span key={r} className={styles.roleTag}>{r}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
