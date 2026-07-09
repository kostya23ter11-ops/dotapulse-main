import { OPENDOTA_BASE_URL, getHeroImageUrl, getHeroImageByName } from './opendota';
import { fetchWithTimeout } from './fetchWithTimeout';
import proPlayersFallback from './proPlayers.json';

import type { LeaderboardHeroRaw, OpenDotaHeroRaw, ProPlayer } from './types';
import { odNum } from './types';
import { CACHE_KEYS, CACHE_TTL, cacheGet, cacheSet } from './serverCache';

function getHeroImage(hero: OpenDotaHeroRaw & { name?: string }) {
  if (hero.img) return getHeroImageUrl(hero.img);
  return getHeroImageByName(hero.localized_name || hero.name || '');
}

async function fetchHeroStats() {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }

  try {
    const res = await fetchWithTimeout(`${OPENDOTA_BASE_URL}/heroStats`, {
      next: { revalidate: 600 },
    }).catch(() => null);
    if (res && res.ok) return await res.json();
  } catch (_) {}
  return null;
}

export async function getAllHeroStatsRaw() {
  const data = await fetchHeroStats();
  if (!data) return [];

  return data.map((hero: OpenDotaHeroRaw): LeaderboardHeroRaw => ({
    id: hero.id,
    name: hero.localized_name || 'Unknown',
    image: getHeroImage(hero),
    roles: hero.roles || [],
    primary_attr: hero.primary_attr,
    attack_type: hero.attack_type,
    raw: {
      '1_pick': odNum(hero, '1_pick'), '1_win': odNum(hero, '1_win'),
      '2_pick': odNum(hero, '2_pick'), '2_win': odNum(hero, '2_win'),
      '3_pick': odNum(hero, '3_pick'), '3_win': odNum(hero, '3_win'),
      '4_pick': odNum(hero, '4_pick'), '4_win': odNum(hero, '4_win'),
      '5_pick': odNum(hero, '5_pick'), '5_win': odNum(hero, '5_win'),
      '6_pick': odNum(hero, '6_pick'), '6_win': odNum(hero, '6_win'),
      '7_pick': odNum(hero, '7_pick'), '7_win': odNum(hero, '7_win'),
      '8_pick': odNum(hero, '8_pick'), '8_win': odNum(hero, '8_win'),
      'pro_pick': odNum(hero, 'pro_pick'), 'pro_win': odNum(hero, 'pro_win'),
    },
  }));
}

function mapProPlayers(data: typeof proPlayersFallback): ProPlayer[] {
  return data.map(p => ({
    id: p.account_id,
    name: p.personaname || 'Unknown',
    avatar: p.avatarfull,
    team: p.team_name || 'Free Agent',
    teamTag: p.team_tag || '',
    country: (p.country_code || '').toUpperCase(),
    lastMatch: p.last_match_time || null,
    role: p.fantasy_role || 0,
  }));
}

export async function getProLeaderboard(): Promise<ProPlayer[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return mapProPlayers(proPlayersFallback);
  }

  const cached = await cacheGet<ProPlayer[]>(CACHE_KEYS.proLeaderboard);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout('https://api.opendota.com/api/proPlayers', {
      next: { revalidate: 3600 },
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const players: ProPlayer[] = data
          .filter((p: { is_pro?: boolean }) => p.is_pro)
          .map((p: {
            account_id: number;
            personaname?: string;
            name?: string;
            avatarfull?: string;
            avatarmedium?: string;
            team_name?: string;
            team_tag?: string;
            country_code?: string;
            last_match_time?: string | null;
            fantasy_role?: number;
          }) => ({
            id: p.account_id,
            name: p.personaname || p.name || 'Unknown',
            avatar: p.avatarfull || p.avatarmedium,
            team: p.team_name || p.team_tag || 'Free Agent',
            teamTag: p.team_tag || '',
            country: (p.country_code || '').toUpperCase(),
            lastMatch: p.last_match_time || null,
            role: p.fantasy_role || 0,
          }))
          .sort((a, b) => {
            if (!a.lastMatch) return 1;
            if (!b.lastMatch) return -1;
            return new Date(b.lastMatch).getTime() - new Date(a.lastMatch).getTime();
          });

        await cacheSet(CACHE_KEYS.proLeaderboard, players, CACHE_TTL.proLeaderboard);
        return players;
      }
    }
  } catch {
    // fall through to local fallback
  }

  return mapProPlayers(proPlayersFallback);
}
