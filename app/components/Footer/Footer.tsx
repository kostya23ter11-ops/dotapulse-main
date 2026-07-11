'use client';

import Link from 'next/link';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './Footer.module.css';

const Footer = () => {
  const { t } = useLocale();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerTop}>
          <div className={styles.brand}>
            <div className={styles.logoText}>DOTA<span>PULSE</span></div>
            <p className={styles.description}>
              {t('footer.brand')}
            </p>
          </div>
          <div className={styles.links}>
            <h4>{t('footer.navigation')}</h4>
            <ul>
              <li><Link href="/updates">{t('nav.updates')}</Link></li>
              <li><Link href="/builds">{t('nav.builds')}</Link></li>
              <li><Link href="/meta">{t('nav.meta')}</Link></li>
              <li><Link href="/leaderboard">{t('nav.leaderboard')}</Link></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} DotaPulse. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
