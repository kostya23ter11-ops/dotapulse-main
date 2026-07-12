import { kvGet, kvSet, kvDel } from './kv';

export interface PremiumStatus {
  plan: 'pro';
  expiresAt: number;
  paymentId: string;
  createdAt: number;
}

const PREMIUM_TTL_BUFFER = 86400; // 1 day buffer after expiry

function premiumKey(steamId: string): string {
  return `premium:${steamId}`;
}

export async function getPremiumStatus(steamId: string): Promise<PremiumStatus | null> {
  const status = await kvGet<PremiumStatus>(premiumKey(steamId));
  if (!status) return null;
  if (!isPremiumValid(status)) {
    await removePremiumStatus(steamId);
    return null;
  }
  return status;
}

export async function setPremiumStatus(steamId: string, status: PremiumStatus): Promise<void> {
  const ttlSeconds = Math.max(0, Math.ceil((status.expiresAt - Date.now()) / 1000) + PREMIUM_TTL_BUFFER);
  await kvSet(premiumKey(steamId), status, ttlSeconds);
}

export async function removePremiumStatus(steamId: string): Promise<void> {
  await kvDel(premiumKey(steamId));
}

export function isPremiumValid(status: PremiumStatus | null): boolean {
  if (!status) return false;
  return status.expiresAt > Date.now();
}

export const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const PREMIUM_PRICE = '199.00';
export const PREMIUM_CURRENCY = 'RUB';
