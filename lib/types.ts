export type Locale = 'ru' | 'en';

export type RankTab = 'all' | 'pro' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface HeroStats {
  id: number;
  name: string;
  winrate: string;
  winrateNum: number;
  pickrate: number;
  roles: string[];
  image: string;
  primary_attr?: string;
  attack_type?: string;
}

export type HeroStatsByRank = Partial<Record<RankTab | string, HeroStats[]>>;

export interface PlayerData {
  id: string;
  name: string;
  avatar: string;
  profile_url?: string;
  rank_tier: number | null;
  leaderboard_rank: number | null;
}

export interface PlayerWL {
  win: number;
  lose: number;
}

export interface PlayerMatch {
  match_id: number;
  hero_id: number;
  hero_name: string;
  kills: number;
  deaths: number;
  assists: number;
  radiant_win: boolean;
  player_slot: number;
  duration: number;
  start_time: number;
  gold_per_min: number;
  xp_per_min: number;
  hero_damage: number;
  hero_healing: number;
  last_hits: number;
  party_size: number;
}

export interface PlayerHero {
  hero_id: number;
  hero_name: string;
  games: number;
  win: number;
  winrate: string;
  last_played: number;
  image: string;
}

export interface Patch {
  id: number;
  name: string;
  date: string;
  url?: string;
}

export interface OpenDotaHeroRaw {
  id: number;
  localized_name?: string;
  img?: string;
  roles?: string[];
  primary_attr?: string;
  attack_type?: string;
  pro_pick?: number;
  pro_win?: number;
  '1_pick'?: number;
  '1_win'?: number;
  '2_pick'?: number;
  '2_win'?: number;
  '3_pick'?: number;
  '3_win'?: number;
  '4_pick'?: number;
  '4_win'?: number;
  '5_pick'?: number;
  '5_win'?: number;
  '6_pick'?: number;
  '6_win'?: number;
  '7_pick'?: number;
  '7_win'?: number;
  '8_pick'?: number;
  '8_win'?: number;
  [key: string]: string | number | string[] | undefined;
}

export function odNum(hero: OpenDotaHeroRaw, key: string): number {
  const val = hero[key];
  return typeof val === 'number' ? val : 0;
}

export interface AuthUser {
  steamId: string;
  name: string;
  avatar: string;
  role?: 'admin' | 'user';
  premium?: boolean;
  premiumExpiresAt?: number;
}

export interface NewsItem {
  id: number | string;
  title: string;
  date: string;
  image: string;
  category: string;
  excerpt: string;
  fullContent: string;
  externalLink: string;
}

export interface SteamNewsRawItem {
  gid?: string | number;
  title: string;
  contents: string;
  feedlabel?: string;
  date: number;
  url?: string;
}

export interface HeroBuildEntry {
  name: string;
  winrate: number;
  pickrate: number;
  starting_items: string[];
  early_items: string[];
  mid_items: string[];
  late_items: string[];
  situational_items: string[];
  neutral_item: string;
  ability_build: number[];
  talents: Record<string, string>;
}

export interface HeroBuildData {
  id: number;
  name: string;
  lane: string;
  difficulty: string;
  builds: HeroBuildEntry[];
}

export type BuildsDataMap = Record<string, HeroBuildData>;

export interface BuildHeroSummary {
  id: number;
  name: string;
  lane: string;
  difficulty: string;
  roles: string[];
  image: string;
  primary_attr: string;
  winrate: number;
  pickrate: number;
  buildCount: number;
}

export interface ProPlayer {
  id: number;
  name: string;
  avatar?: string;
  team: string;
  teamTag: string;
  country: string;
  lastMatch: string | null;
  role: number;
}

export interface LeaderboardHeroRaw {
  id: number;
  name: string;
  image: string;
  roles: string[];
  primary_attr?: string;
  attack_type?: string;
  raw: Record<string, number>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}