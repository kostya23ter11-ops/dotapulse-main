'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './Admin.module.css';

interface SystemStats {
  system: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    env: string;
  };
  kv: {
    configured: boolean;
    url: string;
  };
  environment: Record<string, string | number | boolean>;
  cache: Record<string, string>;
}

interface NewsItem {
  id: number | string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
}

export default function AdminClient() {
  const { t } = useLocale();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, newsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/news'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (newsRes.ok) {
        const data = await newsRes.json();
        setNews(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function clearCache(key: string = 'all') {
    setCacheClearing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Кэш очищен' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Ошибка очистки кэша' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Ошибка сети' });
    } finally {
      setCacheClearing(false);
    }
  }

  async function refreshNews() {
    setNewsRefreshing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/news', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Новости обновлены: ${data.count} записей` });
        if (data.items) {
          setNews(data.items);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Ошибка обновления новостей' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Ошибка сети' });
    } finally {
      setNewsRefreshing(false);
    }
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className={styles.messageClose}>×</button>
        </div>
      )}

      {/* System Overview */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <i className="bx bx-desktop"></i>
          Система
        </h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Uptime</span>
            <span className={styles.statValue}>{formatUptime(stats?.system.uptime || 0)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Node.js</span>
            <span className={styles.statValue}>{stats?.system.nodeVersion || 'N/A'}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Platform</span>
            <span className={styles.statValue}>{stats?.system.platform || 'N/A'}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Environment</span>
            <span className={styles.statValue}>{stats?.system.env || 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* Environment Variables */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <i className="bx bx-slider"></i>
          Переменные окружения
        </h2>
        <div className={styles.envGrid}>
          {stats?.environment && Object.entries(stats.environment).map(([key, value]) => (
            <div key={key} className={styles.envItem}>
              <span className={styles.envKey}>{key}</span>
              <span className={`${styles.envValue} ${value === true || value === 'configured' ? styles.envOk : value === false ? styles.envMissing : ''}`}>
                {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Cache Management */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <i className="bx bx-data"></i>
          Кэш
        </h2>
        <div className={styles.cacheInfo}>
          <div className={styles.cacheStatus}>
            <span>Redis/KV:</span>
            <span className={stats?.kv.configured ? styles.statusOk : styles.statusWarn}>
              {stats?.kv.configured ? 'Подключён' : 'In-memory fallback'}
            </span>
          </div>
          <div className={styles.cacheKeys}>
            {stats?.cache && Object.entries(stats.cache).map(([name, key]) => (
              <div key={name} className={styles.cacheKey}>
                <span className={styles.cacheKeyName}>{name}:</span>
                <code className={styles.cacheKeyValue}>{key}</code>
              </div>
            ))}
          </div>
          <div className={styles.cacheActions}>
            <button
              onClick={() => clearCache('all')}
              disabled={cacheClearing}
              className={styles.dangerBtn}
            >
              {cacheClearing ? 'Очистка...' : 'Очистить весь кэш'}
            </button>
            {stats?.cache && Object.entries(stats.cache).map(([name, key]) => (
              <button
                key={name}
                onClick={() => clearCache(key)}
                disabled={cacheClearing}
                className={styles.secondaryBtn}
              >
                Очистить {name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* News Management */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <i className="bx bx-news"></i>
          Новости
        </h2>
        <div className={styles.newsActions}>
          <button
            onClick={refreshNews}
            disabled={newsRefreshing}
            className={styles.primaryBtn}
          >
            {newsRefreshing ? 'Обновление...' : 'Обновить новости'}
          </button>
          <span className={styles.newsCount}>{news.length} записей в кэше</span>
        </div>
        {news.length > 0 && (
          <div className={styles.newsList}>
            {news.map((item) => (
              <div key={item.id} className={styles.newsItem}>
                <span className={styles.newsCategory}>{item.category}</span>
                <span className={styles.newsTitle}>{item.title}</span>
                <span className={styles.newsDate}>{item.date}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <i className="bx bx-bolt"></i>
          Быстрые действия
        </h2>
        <div className={styles.quickActions}>
          <a href="/api/admin/stats" target="_blank" className={styles.actionLink}>
            <i className="bx bx-json"></i>
            JSON: Статистика
          </a>
          <a href="/api/admin/news" target="_blank" className={styles.actionLink}>
            <i className="bx bx-news"></i>
            JSON: Новости
          </a>
        </div>
      </section>
    </div>
  );
}
