import { t, defaultLocale } from '../lib/i18n';
import type { Locale } from '../lib/types';

describe('i18n', () => {
  describe('defaultLocale', () => {
    it('is set to ru', () => {
      expect(defaultLocale).toBe('ru');
    });
  });

  describe('t() - Russian (default)', () => {
    it('returns value for existing key', () => {
      expect(t('meta.title')).toBe('Мета Dota 2');
    });

    it('returns value for nested key', () => {
      expect(t('nav.updates')).toBe('Обновления');
      expect(t('auth.login')).toBe('Войти через Steam');
    });

    it('returns key path when key does not exist', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('returns deeply nested missing key as-is', () => {
      expect(t('a.b.c.d')).toBe('a.b.c.d');
    });
  });

  describe('t() - English', () => {
    it('returns English translation', () => {
      expect(t('meta.title', 'en')).toBe('Meta Dota 2');
      expect(t('nav.updates', 'en')).toBe('Updates');
      expect(t('auth.login', 'en')).toBe('Sign in with Steam');
    });

    it('returns key when English translation is missing', () => {
      expect(t('nonexistent.key', 'en')).toBe('nonexistent.key');
    });
  });

  describe('t() - interpolation', () => {
    it('replaces {placeholder} with params', () => {
      const result = t('meta.subtitle', 'ru', { count: 120 });
      expect(result).toBe('Аналитика 120 героев на основе профессиональных матчей.');
    });

    it('replaces multiple placeholders', () => {
      const result = t('leaderboard.heroRating', 'ru', { heroCount: 150, proCount: 50 });
      expect(result).toBe('Рейтинг 150 героев и 50 про-игроков.');
    });

    it('leaves unresolved placeholders as-is', () => {
      const result = t('meta.subtitle', 'ru', {});
      expect(result).toBe('Аналитика {count} героев на основе профессиональных матчей.');
    });

    it('works with English interpolation', () => {
      const result = t('meta.subtitle', 'en', { count: 200 });
      expect(result).toBe('Analytics of 200 heroes based on professional matches.');
    });
  });

  describe('t() - fallback', () => {
    it('falls back to default locale for unknown locale', () => {
      expect(t('meta.title', 'fr' as Locale)).toBe('Мета Dota 2');
    });

    it('returns value for key that exists in both locales', () => {
      expect(t('builds.heroNotFound', 'ru')).toBe('Герой не найден');
      expect(t('builds.heroNotFound', 'en')).toBe('Hero not found');
    });
  });

  describe('t() - all sections exist', () => {
    const sections = [
      { name: 'nav', key: 'nav.updates' },
      { name: 'hero', key: 'hero.title' },
      { name: 'auth', key: 'auth.login' },
      { name: 'features', key: 'features.builds' },
      { name: 'footer', key: 'footer.brand' },
      { name: 'builds', key: 'builds.search' },
      { name: 'meta', key: 'meta.title' },
      { name: 'player', key: 'player.searchPlaceholder' },
      { name: 'leaderboard', key: 'leaderboard.title' },
      { name: 'updates', key: 'updates.title' },
      { name: 'news', key: 'news.latest' },
      { name: 'ai', key: 'ai.placeholder' },
      { name: 'error', key: 'error.title' },
    ];

    sections.forEach(({ name, key }) => {
      it(`has section "${name}" in ru`, () => {
        expect(t(key, 'ru')).not.toBe(key);
      });

      it(`has section "${name}" in en`, () => {
        expect(t(key, 'en')).not.toBe(key);
      });
    });
  });
});
