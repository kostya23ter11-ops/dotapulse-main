import buildsData from './builds-data.json';
import { getAllHeroesStats } from './api';
import type { BuildHeroSummary, BuildsDataMap, HeroBuildData, HeroStats } from './types';

const typedBuildsData = buildsData as BuildsDataMap;

export async function getAllBuildHeroes(): Promise<BuildHeroSummary[]> {
  const heroStats = await getAllHeroesStats();
  const heroStatsMap: Record<number, HeroStats> = {};
  for (const h of heroStats) {
    heroStatsMap[h.id] = h;
  }

  const heroes: BuildHeroSummary[] = [];
  for (const [id, build] of Object.entries(typedBuildsData)) {
    const stats = heroStatsMap[Number(id)];
    heroes.push({
      id: Number(id),
      name: build.name,
      lane: build.lane,
      difficulty: build.difficulty,
      roles: stats?.roles || [],
      image: stats?.image || '',
      primary_attr: stats?.primary_attr || 'str',
      winrate: stats?.winrateNum || 0,
      pickrate: stats?.pickrate || 0,
      buildCount: build.builds.length,
    });
  }

  return heroes.sort((a, b) => b.winrate - a.winrate);
}

export function getBuildsForHero(heroId: string | number): HeroBuildData | null {
  const hero = typedBuildsData[String(heroId)];
  if (!hero) return null;
  return hero;
}