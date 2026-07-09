'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '@/app/context/LocaleContext';
import type { Patch } from '@/lib/types';
import styles from './Updates.module.css';

const UpdatesClient = ({ patches }: { patches: Patch[] }) => {
  const [search, setSearch] = useState('');
  const { t } = useLocale();

  const filtered = useMemo(() => {
    if (!search) return patches;
    return patches.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [patches, search]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('updates.title')}</h1>
        <p className={styles.subtitle}>
          {t('updates.subtitle')}
        </p>
      </div>

      <div className={styles.searchBar}>
        <i className='bx bx-search'></i>
        <input
          type="text"
          placeholder={t('updates.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.patchesList}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <i className='bx bx-file'></i>
            <p>{t('updates.empty')}</p>
          </div>
        ) : (
          filtered.map((patch, index) => (
            <div key={patch.id || index} className={styles.patchCard}>
              <div className={styles.patchHeader}>
                <span className={styles.versionBadge}>{patch.name}</span>
                <span className={styles.patchDate}>
                  {new Date(patch.date).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {patch.url && (
                <a
                  href={patch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.patchLink}
                >
                  <i className='bx bx-link-external'></i> {t('updates.fullNotes')}
                </a>
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.footerNote}>
        <p>
          {t('updates.footerNote')}{' '}
          <a href="https://www.dota2.com/patches" target="_blank" rel="noopener noreferrer">
            {t('updates.footerLink')}
          </a>.
        </p>
      </div>
    </div>
  );
};

export default UpdatesClient;
