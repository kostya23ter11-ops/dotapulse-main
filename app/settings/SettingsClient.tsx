'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './Settings.module.css';

interface User {
  steamId: string;
  name: string;
  premium?: boolean;
  premiumExpiresAt?: number;
}

interface Settings {
  notifications: {
    matches: boolean;
    news: boolean;
    updates: boolean;
    emailDigest: boolean;
  };
  privacy: {
    profileHidden: boolean;
  };
}

const DEFAULTS: Settings = {
  notifications: {
    matches: true,
    news: true,
    updates: true,
    emailDigest: false,
  },
  privacy: {
    profileHidden: false,
  },
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('settings');
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      notifications: { ...DEFAULTS.notifications, ...parsed.notifications },
      privacy: { ...DEFAULTS.privacy, ...parsed.privacy },
    };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(settings: Settings) {
  localStorage.setItem('settings', JSON.stringify(settings));
}

export default function SettingsClient() {
  const { t } = useLocale();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, []);

  const toggle = useCallback(
    (section: 'notifications' | 'privacy', key: string) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          [section]: {
            ...prev[section],
            [key]: !(prev[section] as Record<string, boolean>)[key],
          },
        };
        saveSettings(next);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return next;
      });
    },
    [],
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('settings.title')}</h1>
      <p className={styles.subtitle}>{t('settings.subtitle')}</p>

      {saved && (
        <div className={styles.toast}>
          <i className="bx bx-check-circle" />
          {t('settings.saved')}
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <i className="bx bx-bell" />
          {t('settings.notifications')}
        </h2>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>{t('settings.matches')}</span>
            <span className={styles.settingDesc}>{t('settings.matchesDesc')}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.notifications.matches}
              onChange={() => toggle('notifications', 'matches')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>{t('settings.news')}</span>
            <span className={styles.settingDesc}>{t('settings.newsDesc')}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.notifications.news}
              onChange={() => toggle('notifications', 'news')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>{t('settings.updates')}</span>
            <span className={styles.settingDesc}>{t('settings.updatesDesc')}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.notifications.updates}
              onChange={() => toggle('notifications', 'updates')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>{t('settings.emailDigest')}</span>
            <span className={styles.settingDesc}>{t('settings.emailDigestDesc')}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.notifications.emailDigest}
              onChange={() => toggle('notifications', 'emailDigest')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <i className="bx bx-lock-alt" />
          {t('settings.privacy')}
        </h2>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>{t('settings.profileHidden')}</span>
            <span className={styles.settingDesc}>{t('settings.profileHiddenDesc')}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.privacy.profileHidden}
              onChange={() => toggle('privacy', 'profileHidden')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <i className="bx bx-crown" />
          {t('premium.settingsTitle')}
        </h2>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>
              {user?.premium ? t('premium.statusActive') : t('premium.statusInactive')}
            </span>
            {user?.premium && user.premiumExpiresAt && (
              <span className={styles.settingDesc}>
                {t('premium.expiresIn')} {new Date(user.premiumExpiresAt).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
          <Link href="/premium" className={styles.premiumBtn}>
            {user?.premium ? t('premium.manageBtn') : t('premium.subscribeBtn')}
          </Link>
        </div>
      </section>
    </div>
  );
}
