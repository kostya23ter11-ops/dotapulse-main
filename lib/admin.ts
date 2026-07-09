import type { AuthUser } from './types';

/**
 * Список Steam ID администраторов из переменной окружения.
 * Формат: "76561198012345678,76561198098765432"
 */
export function getAdminSteamIds(): string[] {
  const raw = process.env.ADMIN_STEAM_IDS || '';
  return raw
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);
}

/**
 * Проверяет, является ли пользователь администратором.
 */
export function isAdmin(user: AuthUser | null | undefined): boolean {
  if (!user?.steamId) return false;
  const adminIds = getAdminSteamIds();
  if (adminIds.length === 0) return false;
  return adminIds.includes(user.steamId);
}

/**
 * Возвращает роль пользователя на основе Steam ID.
 */
export function getUserRole(steamId: string): 'admin' | 'user' {
  const adminIds = getAdminSteamIds();
  return adminIds.includes(steamId) ? 'admin' : 'user';
}
