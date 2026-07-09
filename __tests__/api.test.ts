jest.mock('../lib/steam', () => ({
  STEAM_API_KEY: 'test-key',
  STEAM_ENDPOINTS: { PLAYER_SUMMARY: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/' },
}));

jest.mock('../lib/opendota', () => ({
  OPENDOTA_BASE_URL: 'https://api.opendota.com/api',
  getHeroImageUrl: (img: string) => img || 'default.jpg',
  getHeroImageByName: (name: string) => `https://cdn.example.com/${name}.png`,
}));

jest.mock('../lib/localData', () => ({
  localHeroes: [
    { id: 1, name: 'Anti-Mage', primary_attr: 'agi', attack_type: 'Melee', roles: ['Carry'] },
    { id: 2, name: 'Axe', primary_attr: 'str', attack_type: 'Melee', roles: ['Initiator'] },
  ],
}));

jest.mock('../lib/fetchWithTimeout', () => ({
  fetchWithTimeout: jest.fn(),
}));

import { fetchWithTimeout } from '../lib/fetchWithTimeout';

const mockFetchWithTimeout = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>;

function mockResponse<T>(data: T, ok = true): Response {
  return { ok, json: async () => data } as Response;
}

import {
  getRecentPatches,
  getPlayerData,
  getPlayerWL,
  getPlayerRecentMatches,
  getPlayerHeroes,
  getHeroStatsById,
  getHeroStats,
  getHeroStatsByRank,
  getAllHeroesStats,
  clearHeroStatsCache,
} from '../lib/api';

beforeEach(async () => {
  jest.clearAllMocks();
  await clearHeroStatsCache();
});

describe('getRecentPatches', () => {
  it('returns patches from API', async () => {
    const patches = Array.from({ length: 15 }, (_, i) => ({ id: i, name: `7.${30 + i}` }));
    mockFetchWithTimeout.mockResolvedValue(mockResponse(patches));

    const result = await getRecentPatches();

    expect(result).toHaveLength(10);
    expect(result[0].name).toBe('7.44');
  });

  it('returns fallback on API failure', async () => {
    mockFetchWithTimeout.mockResolvedValue(null as unknown as Response);

    const result = await getRecentPatches();

    expect(result).toHaveLength(5);
    expect(result[0].name).toBe('7.37');
  });
});

describe('getPlayerData', () => {
  it('returns player data from Steam API', async () => {
    mockFetchWithTimeout
      .mockResolvedValueOnce(mockResponse({
        response: {
          players: [{
            personaname: 'TestPlayer',
            avatarfull: 'https://avatar.jpg',
            profileurl: 'https://steamcommunity.com/id/test',
          }],
        },
      }))
      .mockResolvedValueOnce(mockResponse({ rank_tier: 80, leaderboard_rank: 100 }));

    const result = await getPlayerData('76561198000000000');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('TestPlayer');
    expect(result!.rank_tier).toBe(80);
  });

  it('returns null when all APIs fail', async () => {
    mockFetchWithTimeout.mockResolvedValue(null as unknown as Response);

    const result = await getPlayerData('76561198000000000');

    expect(result).toBeNull();
  });
});

describe('getPlayerWL', () => {
  it('returns win/loss data', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockResponse({ win: 100, lose: 50 }));

    const result = await getPlayerWL('76561198000000000');

    expect(result).toEqual({ win: 100, lose: 50 });
  });

  it('returns default on failure', async () => {
    mockFetchWithTimeout.mockResolvedValue(null as unknown as Response);

    const result = await getPlayerWL('76561198000000000');

    expect(result).toEqual({ win: 0, lose: 0 });
  });
});

describe('getPlayerRecentMatches', () => {
  it('returns mapped match data', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockResponse([
      {
        match_id: 123,
        hero_id: 14,
        kills: 10,
        deaths: 5,
        assists: 8,
        radiant_win: true,
        player_slot: 0,
        duration: 2400,
        start_time: 1700000000,
        gold_per_min: 500,
        xp_per_min: 600,
        hero_damage: 25000,
      },
    ]));

    const result = await getPlayerRecentMatches('76561198000000000');

    expect(result).toHaveLength(1);
    expect(result[0].hero_name).toBe('Pudge');
    expect(result[0].kills).toBe(10);
  });

  it('returns empty array on failure', async () => {
    mockFetchWithTimeout.mockResolvedValue(null as unknown as Response);

    const result = await getPlayerRecentMatches('76561198000000000');

    expect(result).toEqual([]);
  });
});

describe('getPlayerHeroes', () => {
  it('returns sorted hero data', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockResponse([
      { hero_id: 1, games: 50, win: 30, last_played: 1700000000 },
      { hero_id: 2, games: 100, win: 60, last_played: 1700000000 },
      { hero_id: 3, games: 0, win: 0, last_played: 0 },
    ]));

    const result = await getPlayerHeroes('76561198000000000');

    expect(result).toHaveLength(2);
    expect(result[0].hero_name).toBe('Axe');
    expect(result[0].games).toBe(100);
  });
});

describe('getHeroStats', () => {
  it('returns hero stats sorted by pro_pick', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockResponse([
      { id: 1, localized_name: 'Anti-Mage', pro_pick: 100, pro_win: 50, img: 'img1', primary_attr: 'agi', attack_type: 'Melee', roles: ['Carry'] },
      { id: 2, localized_name: 'Axe', pro_pick: 200, pro_win: 120, img: 'img2', primary_attr: 'str', attack_type: 'Melee', roles: ['Initiator'] },
    ]));

    const result = await getHeroStats(2);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Axe');
    expect(result[0].winrateNum).toBe(60);
  });

  it('returns local heroes on failure', async () => {
    mockFetchWithTimeout.mockResolvedValue(null as unknown as Response);

    const result = await getHeroStats(2);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Anti-Mage');
  });
});

describe('getAllHeroesStats', () => {
  it('returns all heroes sorted by winrate', async () => {
    mockFetchWithTimeout.mockResolvedValue(mockResponse([
      { id: 1, localized_name: 'Anti-Mage', pro_pick: 100, pro_win: 40, img: 'img1', primary_attr: 'agi', attack_type: 'Melee', roles: ['Carry'] },
      { id: 2, localized_name: 'Axe', pro_pick: 200, pro_win: 120, img: 'img2', primary_attr: 'str', attack_type: 'Melee', roles: ['Initiator'] },
    ]));

    const result = await getAllHeroesStats();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Axe');
    expect(result[0].winrate).toBe('60.0%');
  });
});
