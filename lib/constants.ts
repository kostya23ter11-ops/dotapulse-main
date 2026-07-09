import type { RankTab } from './types';

export const RANK_TABS: RankTab[] = ['all', 1, 2, 3, 4, 5, 6, 7, 8, 'pro'];

export function getWinrateColor(wr: number): string {
  if (wr >= 53) return '#4caf50';
  if (wr >= 50) return '#ffc107';
  return '#ff4c4c';
}