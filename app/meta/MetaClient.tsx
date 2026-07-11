'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './Meta.module.css';
import type { HeroStats } from '@/lib/types';

const ITEMS_PER_PAGE = 20;

const MetaClient = ({ initialHeroes = [] }: { initialHeroes?: HeroStats[] }) => {
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('All');
  const [page, setPage] = useState(1);
  const { t } = useLocale();

  const roles = ['All', 'Carry', 'Support', 'Nuker', 'Disabler', 'Durable', 'Escape'];

  const filteredHeroes = useMemo(() => {
    if (!Array.isArray(initialHeroes)) return [];
    return initialHeroes.filter(hero => {
      const matchesSearch = hero.name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = activeRole === 'All' || (hero.roles && hero.roles.includes(activeRole));
      return matchesSearch && matchesRole;
    });
  }, [initialHeroes, search, activeRole]);

  const totalPages = Math.ceil(filteredHeroes.length / ITEMS_PER_PAGE);
  const pagedHeroes = filteredHeroes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getWinrateClass = (wr: number) => {
    if (wr >= 53) return styles.winrateHigh;
    if (wr >= 50) return styles.winrateMedium;
    return styles.winrateLow;
  };

  return (
    <div className={styles.metaContent}>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder={t('meta.search')}
          className={styles.searchInput}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className={styles.roleFilters}>
          {roles.map(role => (
            <button
              key={role}
              className={`${styles.roleBtn} ${activeRole === role ? styles.activeRole : ''}`}
              onClick={() => { setActiveRole(role); setPage(1); }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableInfo}>
        {filteredHeroes.length} {t('meta.heroes')}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.metaTable} aria-label={t('meta.title')}>
          <thead>
            <tr>
              <th>#</th>
              <th>{t('meta.hero')}</th>
              <th>{t('meta.winrate')}</th>
              <th>{t('meta.matches')}</th>
              <th>{t('meta.roles')}</th>
            </tr>
          </thead>
          <tbody>
            {pagedHeroes.map((hero, index) => (
              <tr key={hero.id} className={styles.tableRow}>
                <td className={styles.indexCell}>{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                <td>
                  <div className={styles.heroCell}>
                    <div className={styles.iconWrapper}>
                      {hero.image && (
                        <Image
                          src={hero.image}
                          alt={hero.name}
                          width={45}
                          height={25}
                          className={styles.heroIcon}
                        />
                      )}
                    </div>
                    <span className={styles.heroName}>{hero.name}</span>
                  </div>
                </td>
                <td className={`${styles.winrateCell} ${getWinrateClass(hero.winrateNum)}`}>
                  {hero.winrate}
                </td>
                <td className={styles.pickrateCell}>
                  {hero.pickrate?.toLocaleString()}
                </td>
                <td>
                  <div className={styles.rolesList}>
                    {hero.roles?.slice(0, 2).map(role => (
                      <span key={role} className={styles.roleBadge}>{role}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ‹
          </button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default MetaClient;
