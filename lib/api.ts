import { STEAM_API_KEY, STEAM_ENDPOINTS } from './steam';
import { OPENDOTA_BASE_URL, getHeroImageUrl, getHeroImageByName } from './opendota';
import { localHeroes } from './localData';
import { fetchWithTimeout } from './fetchWithTimeout';
import type {
  HeroStats,
  HeroStatsByRank,
  OpenDotaHeroRaw,
  Patch,
  PlayerData,
  PlayerHero,
  PlayerMatch,
  PlayerWL,
} from './types';
import { odNum } from './types';
import { CACHE_KEYS, CACHE_TTL, cacheDel, cacheGet, cacheSet } from './serverCache';

export async function clearHeroStatsCache(): Promise<void> {
  await cacheDel(CACHE_KEYS.heroStats);
}

async function fetchHeroStats(): Promise<OpenDotaHeroRaw[] | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }

  const cached = await cacheGet<OpenDotaHeroRaw[]>(CACHE_KEYS.heroStats);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${OPENDOTA_BASE_URL}/heroStats`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const data: OpenDotaHeroRaw[] = await res.json();
    await cacheSet(CACHE_KEYS.heroStats, data, CACHE_TTL.heroStats);
    return data;
  } catch {
    return null;
  }
}

function toAccountId32(accountId: string | number | null | undefined): string | null {
  if (!accountId) return null;
  const str = String(accountId).trim();
  if (str.length > 10) {
    return (BigInt(str) - BigInt('76561197960265728')).toString();
  }
  return str;
}

export async function getRecentPatches(): Promise<Patch[]> {
  try {
    const res = await fetchWithTimeout(`${OPENDOTA_BASE_URL}/patches`, {
      next: { revalidate: 3600 },
    });
    if (!res || !res.ok) throw new Error('Patches API failed');
    const data = await res.json();
    return data.slice(-10).reverse();
  } catch {
    return [
      { id: 1, name: '7.37', date: '2026-06-10T00:00:00.000Z' },
      { id: 2, name: '7.36c', date: '2026-05-28T00:00:00.000Z' },
      { id: 3, name: '7.36b', date: '2026-05-15T00:00:00.000Z' },
      { id: 4, name: '7.36', date: '2026-04-01T00:00:00.000Z' },
      { id: 5, name: '7.35d', date: '2025-12-20T00:00:00.000Z' },
    ];
  }
}

const HERO_NAME_MAP = {
  1: 'Anti-Mage', 2: 'Axe', 3: 'Bane', 4: 'Bloodseeker', 5: 'Crystal Maiden',
  6: 'Drow Ranger', 7: 'Earthshaker', 8: 'Juggernaut', 9: 'Mirana', 10: 'Morphling',
  11: 'Shadow Fiend', 12: 'Phantom Lancer', 13: 'Puck',
  14: 'Pudge', 15: 'Razor', 16: 'Sand King', 17: 'Storm Spirit', 18: 'Sven',
  19: 'Tiny', 20: 'Vengeful Spirit', 21: 'Windranger', 22: 'Zeus', 23: 'Kunkka',
  25: 'Lina', 26: 'Lion', 27: 'Shadow Shaman', 28: 'Slardar', 29: 'Tidehunter',
  30: 'Witch Doctor', 31: 'Lich', 32: 'Riki', 33: 'Enigma', 34: 'Tinker',
  35: 'Sniper', 36: 'Necrophos', 37: 'Warlock', 38: 'Beastmaster', 39: 'Queen of Pain',
  40: 'Venomancer', 41: 'Faceless Void', 42: 'Wraith King', 43: 'Death Prophet', 44: 'Phantom Assassin',
  45: 'Pugna', 46: 'Templar Assassin', 47: 'Viper', 48: 'Luna', 49: 'Dragon Knight',
  50: 'Dazzle', 51: 'Clockwerk', 52: 'Leshrac', 53: 'Nature\'s Prophet', 54: 'Lifestealer',
  55: 'Dark Seer', 56: 'Clinkz', 57: 'Omniknight', 58: 'Enchantress', 59: 'Huskar',
  60: 'Night Stalker', 61: 'Broodmother', 62: 'Bounty Hunter', 63: 'Weaver', 64: 'Jakiro',
  65: 'Batrider', 66: 'Chen', 67: 'Spectre', 68: 'Ancient Apparition', 69: 'Doom',
  70: 'Ursa', 71: 'Spirit Breaker', 72: 'Gyrocopter', 73: 'Alchemist', 74: 'Invoker',
  75: 'Silencer', 76: 'Outworld Destroyer', 77: 'Lycan', 78: 'Brewmaster', 79: 'Shadow Demon',
  80: 'Lone Druid', 81: 'Chaos Knight', 82: 'Meepo', 83: 'Treant Protector', 84: 'Ogre Magi',
  85: 'Undying', 86: 'Rubick', 87: 'Disruptor', 88: 'Nyx Assassin', 89: 'Naga Siren',
  90: 'Keeper of the Light', 91: 'Io', 92: 'Visage', 93: 'Slark', 94: 'Medusa',
  95: 'Troll Warlord', 96: 'Centaur Warrunner', 97: 'Magnus', 98: 'Timbersaw', 99: 'Bristleback',
  100: 'Tusk', 101: 'Skywrath Mage', 102: 'Abaddon', 103: 'Elder Titan', 104: 'Legion Commander',
  105: 'Ember Spirit', 106: 'Earth Spirit', 107: 'Underlord', 108: 'Terrorblade', 109: 'Phoenix',
  110: 'Oracle', 111: 'Techies', 112: 'Winter Wyvern', 113: 'Arc Warden', 114: 'Monkey King',
  119: 'Dark Willow', 120: 'Pangolier', 121: 'Grimstroke', 123: 'Hoodwink', 126: 'Void Spirit',
  128: 'Snapfire', 129: 'Mars', 131: 'Ring Master', 135: 'Dawnbreaker', 136: 'Marci',
  137: 'Primal Beast', 138: 'Muerta', 145: 'Kez', 155: 'Largo'
};

function getHeroName(heroId: number): string {
  return HERO_NAME_MAP[heroId as keyof typeof HERO_NAME_MAP] || `Hero #${heroId}`;
}

function mapLocalHero(h: HeroStats): HeroStats {
  return {
    ...h,
    image: getHeroImageByName(h.name),
    primary_attr: h.primary_attr || 'str',
  };
}

export async function getPlayerData(accountId: string): Promise<PlayerData | null> {
  try {
    let steamId64 = accountId;
    if (accountId && accountId.length <= 10) {
      steamId64 = (BigInt(accountId) + BigInt('76561197960265728')).toString();
    }

    let player = null;
    if (STEAM_API_KEY) {
      const url = `${STEAM_ENDPOINTS.PLAYER_SUMMARY}?key=${STEAM_API_KEY}&steamids=${steamId64}`;
      const response = await fetchWithTimeout(url, { next: { revalidate: 60 } }).catch(() => null);
      if (response && response.ok) {
        const data = await response.json();
        player = data.response?.players?.[0] || null;
      }
    }

    const acc32 = toAccountId32(accountId);

    let rankTier = null;
    let leaderboardRank = null;
    try {
      const odRes = await fetchWithTimeout(`${OPENDOTA_BASE_URL}/players/${acc32}`, {
        next: { revalidate: 120 },
      }).catch(() => null);
      if (odRes && odRes.ok) {
        const od = await odRes.json();
        rankTier = od.rank_tier || null;
        leaderboardRank = od.leaderboard_rank || null;
      }
    } catch (_) {}

    if (player) {
      return {
        id: accountId,
        name: player.personaname,
        avatar: player.avatarfull,
        profile_url: player.profileurl,
        rank_tier: rankTier,
        leaderboard_rank: leaderboardRank
      };
    }

    if (acc32) {
      try {
        const odRes = await fetchWithTimeout(`${OPENDOTA_BASE_URL}/players/${acc32}`, {
          next: { revalidate: 120 },
        }).catch(() => null);
        if (odRes && odRes.ok) {
          const od = await odRes.json();
          const p = od.profile || {};
          return {
            id: accountId,
            name: p.personaname || `Player ${acc32}`,
            avatar: p.avatarfull || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
            profile_url: p.profileurl,
            rank_tier: od.rank_tier || rankTier,
            leaderboard_rank: od.leaderboard_rank || leaderboardRank
          };
        }
      } catch (_) {}
    }

    return null;
  } catch {
    return null;
  }
}

export async function getPlayerWL(accountId: string): Promise<PlayerWL> {
  try {
    const acc32 = toAccountId32(accountId);
    if (!acc32) return { win: 0, lose: 0 };

    const res = await fetchWithTimeout(`${OPENDOTA_BASE_URL}/players/${acc32}/wl`, {
      next: { revalidate: 60 },
    }).catch(() => null);

    if (!res || !res.ok) return { win: 0, lose: 0 };
    const data = await res.json();
    return { win: data.win || 0, lose: data.lose || 0 };
  } catch {
    return { win: 0, lose: 0 };
  }
}

export async function getPlayerRecentMatches(accountId: string): Promise<PlayerMatch[]> {
  try {
    const acc32 = toAccountId32(accountId);
    if (!acc32) return [];

    const res = await fetchWithTimeout(`${OPENDOTA_BASE_URL}/players/${acc32}/recentMatches`, {
      next: { revalidate: 60 },
    }).catch(() => null);

    if (!res || !res.ok) return [];
    const data = await res.json();

    return (Array.isArray(data) ? data : []).slice(0, 20).map(m => ({
      match_id: m.match_id,
      hero_id: m.hero_id,
      hero_name: getHeroName(m.hero_id),
      kills: m.kills ?? 0,
      deaths: m.deaths ?? 0,
      assists: m.assists ?? 0,
      radiant_win: !!m.radiant_win,
      player_slot: m.player_slot ?? 0,
      duration: m.duration ?? 0,
      start_time: m.start_time ?? 0,
      gold_per_min: m.gold_per_min ?? 0,
      xp_per_min: m.xp_per_min ?? 0,
      hero_damage: m.hero_damage ?? 0,
      hero_healing: m.hero_healing ?? 0,
      last_hits: m.last_hits ?? 0,
      party_size: m.party_size ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getPlayerHeroes(accountId: string): Promise<PlayerHero[]> {
  try {
    const acc32 = toAccountId32(accountId);
    if (!acc32) return [];

    const res = await fetchWithTimeout(`${OPENDOTA_BASE_URL}/players/${acc32}/heroes`, {
      next: { revalidate: 300 },
    }).catch(() => null);

    if (!res || !res.ok) return [];
    const data = await res.json();

    return (Array.isArray(data) ? data : [])
      .filter(h => h.games > 0)
      .map(h => ({
        hero_id: h.hero_id,
        hero_name: getHeroName(h.hero_id),
        games: h.games ?? 0,
        win: h.win ?? 0,
        winrate: h.games > 0 ? ((h.win / h.games) * 100).toFixed(1) : '0.0',
        last_played: h.last_played ?? 0,
        image: getHeroImageByName(getHeroName(h.hero_id)),
      }))
      .sort((a, b) => b.games - a.games);
  } catch {
    return [];
  }
}

export async function getHeroStatsById(heroId: string | number): Promise<HeroStats | null> {
  try {
    const data = await fetchHeroStats();
    if (!data) return null;
    const hero = data.find(h => h.id === Number(heroId));
    return hero ? mapHero(hero, 'pro_pick', 'pro_win') : null;
  } catch {
    return null;
  }
}

function mapHero(hero: OpenDotaHeroRaw, pickKey: string, winKey: string): HeroStats {
  const picks = odNum(hero, pickKey);
  const wins = odNum(hero, winKey);
  const winrateNum = picks > 0 ? parseFloat(((wins / picks) * 100).toFixed(1)) : 0;
  return {
    id: hero.id,
    name: hero.localized_name || 'Unknown',
    winrate: `${winrateNum}%`,
    winrateNum,
    pickrate: picks,
    roles: hero.roles || [],
    image: getHeroImageUrl(hero.img || ''),
    primary_attr: hero.primary_attr,
    attack_type: hero.attack_type,
  };
}

export async function getHeroStats(limit = 8): Promise<HeroStats[]> {
  try {
    const data = await fetchHeroStats();

    if (!data) {
      return localHeroes.slice(0, limit).map(mapLocalHero);
    }

    return data
      .sort((a, b) => (b.pro_pick ?? 0) - (a.pro_pick ?? 0))
      .slice(0, limit)
      .map(hero => mapHero(hero, 'pro_pick', 'pro_win'));
  } catch {
    return localHeroes.slice(0, limit).map(mapLocalHero);
  }
}

const RANK_TIERS = {
  all: { pick: '8_pick', win: '8_win' },
  1: { pick: '1_pick', win: '1_win' },
  2: { pick: '2_pick', win: '2_win' },
  3: { pick: '3_pick', win: '3_win' },
  4: { pick: '4_pick', win: '4_win' },
  5: { pick: '5_pick', win: '5_win' },
  6: { pick: '6_pick', win: '6_win' },
  7: { pick: '7_pick', win: '7_win' },
  8: { pick: '8_pick', win: '8_win' },
  pro: { pick: 'pro_pick', win: 'pro_win' },
};

export async function getHeroStatsByRank(limit = 8): Promise<HeroStatsByRank> {
  try {
    const data = await fetchHeroStats();

    if (!data) {
      return {
        pro: localHeroes.slice(0, limit).map(mapLocalHero),
        all: localHeroes.slice(0, limit).map(mapLocalHero),
      };
    }

    const byRank: HeroStatsByRank = {};

    for (const [key, tier] of Object.entries(RANK_TIERS)) {
      if (key === 'all') {
        byRank[key] = data
          .map((hero): HeroStats => {
            let totalPicks = 0;
            let totalWins = 0;
            for (let i = 1; i <= 8; i++) {
              totalPicks += odNum(hero, `${i}_pick`);
              totalWins += odNum(hero, `${i}_win`);
            }
            const winrateNum = totalPicks > 0 ? parseFloat(((totalWins / totalPicks) * 100).toFixed(1)) : 0;
            return {
              id: hero.id,
              name: hero.localized_name || 'Unknown',
              winrate: `${winrateNum}%`,
              winrateNum,
              pickrate: totalPicks,
              roles: hero.roles || [],
              image: getHeroImageUrl(hero.img || ''),
              primary_attr: hero.primary_attr,
              attack_type: hero.attack_type,
            };
          })
          .sort((a, b) => b.pickrate - a.pickrate)
          .slice(0, limit);
      } else if (key === '8') {
        byRank[key] = data
          .map((hero): HeroStats => {
            let picks = odNum(hero, '8_pick');
            let wins = odNum(hero, '8_win');
            if (picks === 0) {
              picks = hero.pro_pick ?? 0;
              wins = hero.pro_win ?? 0;
            }
            const winrateNum = picks > 0 ? parseFloat(((wins / picks) * 100).toFixed(1)) : 0;
            return {
              id: hero.id,
              name: hero.localized_name || 'Unknown',
              winrate: `${winrateNum}%`,
              winrateNum,
              pickrate: picks,
              roles: hero.roles || [],
              image: getHeroImageUrl(hero.img || ''),
              primary_attr: hero.primary_attr,
              attack_type: hero.attack_type,
            };
          })
          .sort((a, b) => b.pickrate - a.pickrate)
          .slice(0, limit);
      } else {
        byRank[key] = data
          .map(hero => mapHero(hero, tier.pick, tier.win))
          .sort((a, b) => b.pickrate - a.pickrate)
          .slice(0, limit);
      }
    }

    return byRank;
  } catch {
    return {
      pro: localHeroes.slice(0, limit).map(mapLocalHero),
      all: localHeroes.slice(0, limit).map(mapLocalHero),
    };
  }
}

export async function getAllHeroesStats(): Promise<HeroStats[]> {
  try {
    const data = await fetchHeroStats();

    if (!data) {
      return localHeroes.map(h => ({
        ...h,
        image: getHeroImageByName(h.name),
        attack_type: h.attack_type || 'Melee'
      }));
    }

    return data.map((hero): HeroStats => {
      const proPick = hero.pro_pick ?? 0;
      const proWin = hero.pro_win ?? 0;
      const winrateNum = proPick > 0
        ? ((proWin / proPick) * 100).toFixed(1)
        : '0';

      return {
        id: hero.id,
        name: hero.localized_name || 'Unknown',
        winrate: `${winrateNum}%`,
        winrateNum: parseFloat(String(winrateNum)),
        pickrate: proPick,
        roles: hero.roles || [],
        image: getHeroImageUrl(hero.img || ''),
        primary_attr: hero.primary_attr,
        attack_type: hero.attack_type
      };
    }).sort((a, b) => b.winrateNum - a.winrateNum);
  } catch {
    return localHeroes.map(h => ({
      ...h,
      image: getHeroImageByName(h.name),
      attack_type: h.attack_type || 'Melee'
    }));
  }
}
