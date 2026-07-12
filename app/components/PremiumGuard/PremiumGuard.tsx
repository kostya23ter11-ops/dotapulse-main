'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './PremiumGuard.module.css';

interface PremiumGuardProps {
  children: ReactNode;
  isPremium: boolean;
}

export default function PremiumGuard({ children, isPremium }: PremiumGuardProps) {
  const { t } = useLocale();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <i className="bx bx-crown" />
        <h3 className={styles.title}>{t('premium.gatedTitle')}</h3>
        <p className={styles.desc}>{t('premium.gatedDesc')}</p>
        <Link href="/premium" className={styles.cta}>
          {t('premium.cta')}
        </Link>
      </div>
    </div>
  );
}
