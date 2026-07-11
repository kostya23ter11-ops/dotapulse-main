'use client';

import { useState, useEffect } from 'react';
import styles from './Hero.module.css';
import FeatureCards from '../FeatureCards/FeatureCards';
import PlayerSearch from '../PlayerSearch/PlayerSearch';
import Image from 'next/image';
import { useLocale } from '@/app/context/LocaleContext';

const Hero = () => {
  const { t } = useLocale();
  const [bgUrl, setBgUrl] = useState('/fon.jpg');

  useEffect(() => {
    fetch('/api/admin/background')
      .then(r => r.json())
      .then(data => { if (data.current) setBgUrl(data.current); })
      .catch(() => {});
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.bgWrapper}>
        <Image
          src={bgUrl}
          alt="Dota 2 Background"
          fill
          sizes="100vw"
          className={styles.bgImage}
          priority
        />
      </div>
      
      <div className={styles.heroContent}>
        <div className={styles.heroTitleRow}>
          <div className={styles.heroTextCenter}>
            <h1 className={styles.floatingText}>{t('hero.title')}</h1>
            <p className={styles.floatingTextDelay}>{t('hero.subtitle')}</p>
          </div>
          <div className={styles.immortalBadge}>
            <Image src="/titan.png" alt="Immortal Rank" width={110} height={110} />
          </div>
        </div>
        <PlayerSearch />

        <FeatureCards />
      </div>
    </section>
  );
};

export default Hero;
