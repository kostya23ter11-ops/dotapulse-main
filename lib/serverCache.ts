import { kvDel, kvGet, kvSet } from './kv';

export const CACHE_KEYS = {
  heroStats: 'dota:cache:hero-stats',
  newsLatest: 'dota:cache:news:latest',
  proLeaderboard: 'dota:cache:pro-leaderboard',
} as const;

export const CACHE_TTL = {
  heroStats: 300,
  newsLatest: 3 * 60 * 60,
  proLeaderboard: 3600,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  return kvGet<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await kvSet(key, value, ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await kvDel(key);
}