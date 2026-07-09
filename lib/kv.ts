import { Redis } from '@upstash/redis';

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

let redisClient: Redis | null = null;

function getKvUrl(): string | undefined {
  return (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    undefined
  );
}

function getKvToken(): string | undefined {
  return (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    undefined
  );
}

export function isKvConfigured(): boolean {
  return Boolean(getKvUrl() && getKvToken());
}

function getRedis(): Redis | null {
  if (!isKvConfigured()) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: getKvUrl()!,
      token: getKvToken()!,
    });
  }
  return redisClient;
}

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
  });
}

function memoryIncr(key: string, ttlSeconds: number): number {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || (entry.expiresAt > 0 && entry.expiresAt < now)) {
    memoryStore.set(key, { value: '1', expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }
  const next = Number(entry.value) + 1;
  entry.value = String(next);
  return next;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (redis) {
    try {
      return await redis.get<T>(key);
    } catch (error) {
      console.error('[KV] get failed, using memory fallback:', error);
    }
  }

  const raw = memoryGet(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

export async function kvSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch (error) {
      console.error('[KV] set failed, using memory fallback:', error);
    }
  }

  memorySet(key, JSON.stringify(value), ttlSeconds);
}

export async function kvDel(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (error) {
      console.error('[KV] del failed, using memory fallback:', error);
    }
  }
  memoryStore.delete(key);
}

export async function kvIncr(key: string, ttlSeconds: number): Promise<number> {
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      console.error('[KV] incr failed, using memory fallback:', error);
    }
  }

  return memoryIncr(key, ttlSeconds);
}

/** @internal — for tests only */
export function _resetMemoryStore(): void {
  memoryStore.clear();
  redisClient = null;
}