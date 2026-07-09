'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './Meta.module.css';
import type { HeroStats } from '@/lib/types';

const MetaClient = ({ initialHeroes = [] }: { initialHeroes?: HeroStats[] }) => {
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('All');
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
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.roleFilters}>
          {roles.map(role => (
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

      <div className={styles.tableWrapper}>
        <table className={styles.metaTable}>
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
            {filteredHeroes.map((hero, index) => (
              <tr key={hero.id} className={styles.tableRow}>
                <td className={styles.indexCell}>{index + 1}</td>
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
    </div>
  );
};

export default MetaClient;
