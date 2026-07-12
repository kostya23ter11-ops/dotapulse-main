'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './Premium.module.css';

interface User {
  steamId: string;
  name: string;
  avatar: string;
  premium?: boolean;
  premiumExpiresAt?: number;
}

export default function PremiumClient() {
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/api/auth/login';
      return;
    }

    setPurchasing(true);
    try {
      const res = await fetch('/api/premium/checkout', { method: 'POST' });
      const data = await res.json();

      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        alert(data.error || 'Payment failed');
        setPurchasing(false);
      }
    } catch {
      alert('Connection error');
      setPurchasing(false);
    }
  };

  const isPremium = user?.premium && user.premiumExpiresAt && user.premiumExpiresAt > Date.now();
  const expiresDate = user?.premiumExpiresAt
    ? new Date(user.premiumExpiresAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.crownIcon}>
          <i className="bx bx-crown" />
        </div>
        <h1 className={styles.title}>
          DotaPulse <span className={styles.pro}>PRO</span>
        </h1>
        <p className={styles.subtitle}>{t('premium.heroSubtitle')}</p>

        {!loading && isPremium && (
          <div className={styles.activeBadge}>
            <i className="bx bx-check-circle" />
            {t('premium.active')} {expiresDate}
          </div>
        )}
      </div>

      <div className={styles.pricingCard}>
        <div className={styles.priceRow}>
          <span className={styles.price}>199 ₽</span>
          <span className={styles.period}>/ {t('premium.month')}</span>
        </div>
        <p className={styles.priceNote}>{t('premium.priceNote')}</p>

        {!isPremium && (
          <button
            className={styles.buyButton}
            onClick={handleSubscribe}
            disabled={purchasing}
          >
            {purchasing ? (
              <>{t('premium.processing')}</>
            ) : user ? (
              <>{t('premium.subscribe')}</>
            ) : (
              <>{t('premium.loginToSubscribe')}</>
            )}
          </button>
        )}
      </div>

      <div className={styles.features}>
        <h2 className={styles.featuresTitle}>{t('premium.featuresTitle')}</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <i className="bx bx-bot" />
            <h3>{t('premium.featAi')}</h3>
            <p>{t('premium.featAiDesc')}</p>
          </div>
          <div className={styles.featureCard}>
            <i className="bx bx-bar-chart-alt-2" />
            <h3>{t('premium.featAnalytics')}</h3>
            <p>{t('premium.featAnalyticsDesc')}</p>
          </div>
          <div className={styles.featureCard}>
            <i className="bx bx-no-entry" />
            <h3>{t('premium.featNoAds')}</h3>
            <p>{t('premium.featNoAdsDesc')}</p>
          </div>
          <div className={styles.featureCard}>
            <i className="bx bx-crown" />
            <h3>{t('premium.featCustomization')}</h3>
            <p>{t('premium.featCustomizationDesc')}</p>
          </div>
        </div>
      </div>

      <div className={styles.faq}>
        <h2 className={styles.faqTitle}>FAQ</h2>
        <div className={styles.faqItem}>
          <h4>{t('premium.faqCancelQ')}</h4>
          <p>{t('premium.faqCancelA')}</p>
        </div>
        <div className={styles.faqItem}>
          <h4>{t('premium.faqPaymentQ')}</h4>
          <p>{t('premium.faqPaymentA')}</p>
        </div>
        <div className={styles.faqItem}>
          <h4>{t('premium.faqRenewQ')}</h4>
          <p>{t('premium.faqRenewA')}</p>
        </div>
      </div>
    </div>
  );
}
