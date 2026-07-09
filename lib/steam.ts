// IMPORTANT: Never hardcode API keys. Loaded from environment (.env.local or deployment vars).
// The key in .env.local is used for Steam profile enrichment in auth and player data.
export const STEAM_API_KEY = (process.env.STEAM_API_KEY || '').replace(/["']/g, '').trim();
export const STEAM_API_URL = 'https://api.steampowered.com';

// Эндпоинты Valve
export const STEAM_ENDPOINTS = {
  PLAYER_SUMMARY: `${STEAM_API_URL}/ISteamUser/GetPlayerSummaries/v0002/`,
};
