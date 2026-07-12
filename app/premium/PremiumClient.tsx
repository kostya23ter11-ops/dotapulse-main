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
      {/* Hero with animated glow */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
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

      {/* Pricing Card with glow */}
      <div className={styles.pricingSection}>
        <div className={styles.pricingCard}>
          <div className={styles.pricingGlow} />
          <div className={styles.popularBadge}>{t('premium.popular')}</div>
          <div className={styles.priceRow}>
            <span className={styles.price}>199</span>
            <div className={styles.priceCurrency}>
              <span className={styles.currency}>₽</span>
              <span className={styles.period}>/ {t('premium.month')}</span>
            </div>
          </div>
          <p className={styles.priceNote}>{t('premium.priceNote')}</p>

          {!isPremium && (
            <button
              className={styles.buyButton}
              onClick={handleSubscribe}
              disabled={purchasing}
            >
              {purchasing ? (
                <span className={styles.spinner} />
              ) : (
                <i className="bx bx-crown" />
              )}
              {purchasing
                ? t('premium.processing')
                : user
                  ? t('premium.subscribe')
                  : t('premium.loginToSubscribe')}
            </button>
          )}

          <div className={styles.priceFeatures}>
            <div className={styles.priceFeature}>
              <i className="bx bx-check" />
              <span>{t('premium.featAi')}</span>
            </div>
            <div className={styles.priceFeature}>
              <i className="bx bx-check" />
              <span>{t('premium.featAnalytics')}</span>
            </div>
            <div className={styles.priceFeature}>
              <i className="bx bx-check" />
              <span>{t('premium.featNoAds')}</span>
            </div>
            <div className={styles.priceFeature}>
              <i className="bx bx-check" />
              <span>{t('premium.featCustomization')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className={styles.comparison}>
        <h2 className={styles.sectionTitle}>{t('premium.compareTitle')}</h2>
        <div className={styles.comparisonTable}>
          <div className={styles.comparisonHeader}>
            <div className={styles.comparisonFeature}>{t('premium.feature')}</div>
            <div className={styles.comparisonFree}>Free</div>
            <div className={styles.comparisonPro}>PRO</div>
          </div>
          <div className={styles.comparisonRow}>
            <div className={styles.comparisonFeature}>{t('premium.featAi')}</div>
            <div className={styles.comparisonFree}>
              <span className={styles.limited}>15 / мин</span>
            </div>
            <div className={styles.comparisonPro}>
              <i className="bx bx-check" />
            </div>
          </div>
          <div className={styles.comparisonRow}>
            <div className={styles.comparisonFeature}>{t('premium.featAnalytics')}</div>
            <div className={styles.comparisonFree}>
              <i className="bx bx-x" />
            </div>
            <div className={styles.comparisonPro}>
              <i className="bx bx-check" />
            </div>
          </div>
          <div className={styles.comparisonRow}>
            <div className={styles.comparisonFeature}>{t('premium.featNoAds')}</div>
            <div className={styles.comparisonFree}>
              <i className="bx bx-x" />
            </div>
            <div className={styles.comparisonPro}>
              <i className="bx bx-check" />
            </div>
          </div>
          <div className={styles.comparisonRow}>
            <div className={styles.comparisonFeature}>{t('premium.featCustomization')}</div>
            <div className={styles.comparisonFree}>
              <i className="bx bx-x" />
            </div>
            <div className={styles.comparisonPro}>
              <i className="bx bx-check" />
            </div>
          </div>
          <div className={styles.comparisonRow}>
            <div className={styles.comparisonFeature}>{t('premium.featPriority')}</div>
            <div className={styles.comparisonFree}>
              <i className="bx bx-x" />
            </div>
            <div className={styles.comparisonPro}>
              <i className="bx bx-check" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className={styles.features}>
        <h2 className={styles.sectionTitle}>{t('premium.featuresTitle')}</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <i className="bx bx-bot" />
            </div>
            <h3>{t('premium.featAi')}</h3>
            <p>{t('premium.featAiDesc')}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <i className="bx bx-bar-chart-alt-2" />
            </div>
            <h3>{t('premium.featAnalytics')}</h3>
            <p>{t('premium.featAnalyticsDesc')}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <i className="bx bx-no-entry" />
            </div>
            <h3>{t('premium.featNoAds')}</h3>
            <p>{t('premium.featNoAdsDesc')}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <i className="bx bx-crown" />
            </div>
            <h3>{t('premium.featCustomization')}</h3>
            <p>{t('premium.featCustomizationDesc')}</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className={styles.faq}>
        <h2 className={styles.sectionTitle}>FAQ</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <div className={styles.faqIcon}>
              <i className="bx bx-help-circle" />
            </div>
            <div>
              <h4>{t('premium.faqCancelQ')}</h4>
              <p>{t('premium.faqCancelA')}</p>
            </div>
          </div>
          <div className={styles.faqItem}>
            <div className={styles.faqIcon}>
              <i className="bx bx-credit-card" />
            </div>
            <div>
              <h4>{t('premium.faqPaymentQ')}</h4>
              <p>{t('premium.faqPaymentA')}</p>
            </div>
          </div>
          <div className={styles.faqItem}>
            <div className={styles.faqIcon}>
              <i className="bx bx-refresh" />
            </div>
            <div>
              <h4>{t('premium.faqRenewQ')}</h4>
              <p>{t('premium.faqRenewA')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      {!isPremium && (
        <div className={styles.bottomCta}>
          <p>{t('premium.bottomCta')}</p>
          <button className={styles.buyButtonSmall} onClick={handleSubscribe}>
            <i className="bx bx-crown" />
            {t('premium.subscribe')}
          </button>
        </div>
      )}
    </div>
  );
}
