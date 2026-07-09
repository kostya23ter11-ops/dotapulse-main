import { kvIncr } from './kv';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const count = await kvIncr(key, windowSeconds);
  const allowed = count <= maxRequests;
  const remaining = Math.max(0, maxRequests - count);

  return { allowed, remaining, limit: maxRequests };
}