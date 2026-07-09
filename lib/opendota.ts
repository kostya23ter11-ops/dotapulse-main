export const OPENDOTA_BASE_URL = 'https://api.opendota.com/api';
export const STEAM_CDN_URL = 'https://cdn.cloudflare.steamstatic.com';

export function getHeroImageUrl(path: string): string {
  if (!path) return '';
  return `${STEAM_CDN_URL}${path}`;
}

export function getHeroImageByName(name: string): string {
  if (!name) return '';
  const slug = name.toLowerCase().replace(/ /g, '_');
  return getHeroImageUrl(`/apps/dota2/images/dota_react/heroes/${slug}.png`);
}