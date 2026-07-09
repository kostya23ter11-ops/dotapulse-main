'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './PlayerSearch.module.css';

const PlayerSearch = () => {
  const [accountId, setAccountId] = useState('');
  const router = useRouter();
  const { t } = useLocale();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) return;
    router.push(`/players/${accountId.trim()}`);
  };

  return (
    <form className={styles.searchContainer} onSubmit={handleSearch}>
      <input
        type="text"
        placeholder={t('player.searchPlaceholder')}
        className={styles.searchInput}
        value={accountId}
        onChange={(e) => setAccountId(e.target.value.replace(/\D/g, ''))}
      />
      <button type="submit" className={styles.searchButton}>
        {t('auth.find')}
      </button>
    </form>
  );
};

export default PlayerSearch;
