'use client';

import { useLocale } from '@/app/context/LocaleContext';
import styles from './Settings.module.css';

export default function SettingsClient() {
  const { t } = useLocale();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('auth.settings')}</h1>
      <p className={styles.placeholder}>Скоро здесь появятся настройки аккаунта.</p>
    </div>
  );
}
