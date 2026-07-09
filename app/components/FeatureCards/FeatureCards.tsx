'use client';
import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './FeatureCards.module.css';

const FeatureCards = () => {
  const { t } = useLocale();

  const features = [
    { id: 1, title: t('features.builds'), desc: t('features.buildsDesc'), icon: 'bx bx-crosshair', link: '/builds' },
    { id: 2, title: t('features.meta'), desc: t('features.metaDesc'), icon: 'bx bx-line-chart', link: '/meta' },
    { id: 3, title: t('features.leaderboard'), desc: t('features.leaderboardDesc'), icon: 'bx bxs-trophy', link: '/leaderboard' }
  ];

  return (
    <div className={styles.featuresGrid}>
      {features.map((f) => (
        <Link key={f.id} href={f.link} className={styles.featureCard}>
          <div className={styles.cardIcon}><i className={f.icon}></i></div>
          <h3 className={styles.cardTitle}>{f.title}</h3>
          <p className={styles.cardDesc}>{f.desc}</p>
        </Link>
      ))}
    </div>
  );
};
export default FeatureCards;
