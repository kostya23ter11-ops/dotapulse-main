'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/app/context/LocaleContext';
import type { NewsItem } from '@/lib/types';
import styles from './NewsSection.module.css';

const FALLBACK_IMAGE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png';

const NewsSection = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const CARD_WIDTH = 340;
  const { t } = useLocale();

  const openModal = (item: NewsItem) => {
    setSelectedNews(item);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedNews(null);
    document.body.style.overflow = '';
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const container = carouselRef.current;
    if (!container) return;

    const scrollAmount = CARD_WIDTH;
    const currentScroll = container.scrollLeft;

    if (direction === 'left') {
      container.scrollTo({
        left: Math.max(0, currentScroll - scrollAmount),
        behavior: 'smooth'
      });
    } else {
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({
        left: Math.min(maxScroll, currentScroll + scrollAmount),
        behavior: 'smooth'
      });
    }
  };

  const goToSlide = (index: number) => {
    const container = carouselRef.current;
    if (!container) return;

    const targetScroll = index * CARD_WIDTH;
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    setCurrentSlide(index);
  };

  const refreshNews = () => {
    loadNews(true);
  };

  async function loadNews(force = false) {
    try {
      setLoading(true);
      const url = force ? '/api/news?refresh=1' : '/api/news';
      const res = await fetch(url, { cache: force ? 'no-store' : 'default' });
      const data = await res.json();

      if (data.success && data.items?.length) {
        setNews(data.items);
        setLastUpdated(data.updatedAt);
        setSource(data.source || 'live');
        setIsFallback(false);
      } else {
        setNews(getStaticFallback());
        setLastUpdated(new Date().toISOString());
        setSource('fallback');
        setIsFallback(true);
      }
    } catch {
      setNews(getStaticFallback());
      setLastUpdated(new Date().toISOString());
      setSource('fallback');
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container || news.length === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const slide = Math.round(scrollLeft / CARD_WIDTH);
      const maxSlide = news.length - 1;
      setCurrentSlide(Math.min(Math.max(0, slide), maxSlide));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [news]);

  return (
    <section className={styles.newsSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('news.latest')}</h2>
          <Link href="/updates" className={styles.viewAllLink}>
            {t('news.allUpdates')}
          </Link>
        </div>

        <div className={styles.botBanner}>
          <span className={styles.botBadge}>
            {isFallback ? '⚠️ Fallback mode' : '🟢 News AI Bot active'}
          </span>
          {lastUpdated && (
            <span className={styles.botInfo}>
              Last fetched: {new Date(lastUpdated).toLocaleTimeString('ru-RU')}
              {source && ` (${source})`}
            </span>
          )}
          <button
            onClick={refreshNews}
            className={styles.refreshBtn}
            disabled={loading}
          >
            {loading ? t('news.refreshing') : t('news.refreshNow')}
          </button>
          <span className={styles.imageNote}>{t('news.photoCredit')}</span>
        </div>

        <div className={styles.carouselWrapper}>
          <button
            className={styles.arrowLeft}
            onClick={() => scrollCarousel('left')}
            aria-label={t('news.prevNews')}
          >
            ‹
          </button>

          <div
            ref={carouselRef}
            className={styles.carousel}
          >
            {loading ? (
              <div className={styles.loadingCard}>
                <div className={styles.loadingSpinner}></div>
                <p>{t('news.loading')}</p>
              </div>
            ) : (
              news.map((item) => (
                <div
                  key={item.id}
                  className={styles.newsCard}
                  onClick={() => openModal(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal(item); }}
                >
                  <div className={styles.imageWrapper}>
                    <Image
                      src={item.image || FALLBACK_IMAGE}
                      alt={item.title}
                      fill
                      className={styles.newsImage}
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                    <span className={styles.category}>{item.category}</span>
                  </div>
                  <div className={styles.newsContent}>
                    <span className={styles.date}>{item.date}</span>
                    <h3 className={styles.newsTitle}>{item.title}</h3>
                    <p className={styles.excerpt}>{item.excerpt}</p>
                    <button
                      className={styles.readMore}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(item);
                      }}
                    >
                      {t('news.readMore')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            className={styles.arrowRight}
            onClick={() => scrollCarousel('right')}
            aria-label={t('news.nextNews')}
          >
            ›
          </button>
        </div>

        {!loading && news.length > 0 && (
          <div className={styles.dots}>
            {news.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${currentSlide === index ? styles.dotActive : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`${t('news.goToNews')} ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className={styles.bottomLink}>
          <Link href="/updates" className={styles.viewAllLink}>
            {t('news.goToUpdates')}
          </Link>
        </div>
      </div>

      {selectedNews && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={selectedNews.title}
          >
            <button className={styles.modalClose} onClick={closeModal} aria-label={t('news.close')}>
              ×
            </button>

            <div className={styles.modalImageWrapper}>
              <Image
                src={selectedNews.image || FALLBACK_IMAGE}
                alt={selectedNews.title}
                fill
                className={styles.modalImage}
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
              />
              <span className={styles.modalCategory}>{selectedNews.category}</span>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalDate}>{selectedNews.date}</div>
              <h2 className={styles.modalTitle}>{selectedNews.title}</h2>

              <div className={styles.modalText}>
                {selectedNews.fullContent.split('\n').map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {selectedNews.externalLink && (
                <a
                  href={selectedNews.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  {t('news.openOfficial')}
                </a>
              )}

              <div className={styles.modalActions}>
                <button onClick={closeModal} className={styles.modalButton}>
                  {t('news.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

function getStaticFallback(): NewsItem[] {
  return [
    {
      id: 1,
      title: 'Патч 7.41d: Новые механики и баланс',
      date: '4 июня 2026',
      image: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/earthshaker.png',
      category: 'Патч',
      excerpt: 'Вышел крупный геймплейный патч 7.41d с изменениями в карте и героях.',
      fullContent: 'Valve выпустила патч 7.41d. Добавлены корректировки карты, баланс героев и исправления. Полные детали доступны на официальном сайте.',
      externalLink: 'https://www.dota2.com/patches/7.41d',
    },
    {
      id: 2,
      title: 'The International 2026: Квалификации в разгаре',
      date: '2 июня 2026',
      image: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/juggernaut.png',
      category: 'Турниры',
      excerpt: 'Открытые и региональные квалификации на главный турнир года идут полным ходом.',
      fullContent: 'Региональные квалификации TI2026 в самом разгаре. Следи за результатами на официальном сайте и в трансляциях.',
      externalLink: 'https://www.dota2.com/news',
    },
    {
      id: 3,
      title: 'Обновления в экономике и ролях',
      date: '1 июня 2026',
      image: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/crystal_maiden.png',
      category: 'Герои',
      excerpt: 'Саппорты получили больше золота и контроля.',
      fullContent: 'В последнем патче сильно изменился баланс ролей. Саппорты теперь имеют больше инструментов.',
      externalLink: 'https://www.dota2.com/news',
    },
    {
      id: 4,
      title: 'Новая коллекция скинов и арокан',
      date: '30 мая 2026',
      image: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/invoker.png',
      category: 'Обновление',
      excerpt: 'Valve выпустила новые Immortal и Arcana.',
      fullContent: 'Доступна новая коллекция косметики в Battle Pass.',
      externalLink: 'https://www.dota2.com/news',
    },
  ];
}

export default NewsSection;
