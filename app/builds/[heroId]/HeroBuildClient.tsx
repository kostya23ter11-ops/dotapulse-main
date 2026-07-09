'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/app/context/LocaleContext';
import type { HeroBuildData, HeroBuildEntry, HeroStats } from '@/lib/types';
import styles from './HeroBuild.module.css';

const ATTR_CLASS = {
  str: styles.attrStr,
  agi: styles.attrAgi,
  int: styles.attrInt,
  all: styles.attrAll,
};

const ATTR_LABEL = {
  str: 'Strength',
  agi: 'Agility',
  int: 'Intelligence',
  all: 'Universal',
};

type AttrKey = keyof typeof ATTR_LABEL;

function formatItemName(internalName: string) {
  return internalName
    .replace(/^item_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function getItemIconUrl(internalName: string) {
  const name = internalName.replace(/^item_/, '');
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${name}.png`;
}

function ItemsRow({ label, items, separatorAfter }: { label: string; items: string[]; separatorAfter?: number }) {
  if (!items || items.length === 0) return null;
  return (
    <>
      <div className={styles.itemsSection}>
        <div className={styles.sectionTitle}>{label}</div>
        <div className={styles.itemsRow}>
          {items.map((item, i) => (
            <div key={i} className={styles.itemSlot}>
              <div className={styles.itemIcon}>
                <img
                  src={getItemIconUrl(item)}
                  alt={formatItemName(item)}
                  loading="lazy"
                />
              </div>
              <span className={styles.itemName}>{formatItemName(item)}</span>
            </div>
          ))}
        </div>
      </div>
      {separatorAfter && <div className={styles.itemSeparator} />}
    </>
  );
}

function AbilityBuildTable({ abilityBuild, skillOrderLabel }: { abilityBuild: number[]; skillOrderLabel: string }) {
  if (!abilityBuild || abilityBuild.length === 0) return null;

  const abilityRows = ['Q', 'W', 'E', 'R'];
  const levels = abilityBuild;

  return (
    <div className={styles.abilitySection}>
      <div className={styles.sectionTitle}>{skillOrderLabel}</div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.abilityTable}>
          <thead>
            <tr>
              <th></th>
              {levels.map((_, i) => (
                <th key={i}>{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {abilityRows.map((row, rowIdx) => (
              <tr key={row}>
                <td style={{ color: '#888', fontWeight: 600, textAlign: 'left' }}>{row}</td>
                {levels.map((level, i) => {
                  const isFilled = level === rowIdx + 1 || (level === 4 && rowIdx === 3);
                  const isUlt = rowIdx === 3;
                  return (
                    <td key={i}>
                      <div
                        className={`${styles.abilityCell} ${isFilled ? styles.filled : ''} ${isUlt && isFilled ? styles.ult : ''}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TalentsSection({ talents, talentsLabel }: { talents: Record<string, string>; talentsLabel: string }) {
  if (!talents || Object.keys(talents).length === 0) return null;

  const levels = ['10', '15', '20', '25'];

  return (
    <div className={styles.talentsSection}>
      <div className={styles.sectionTitle}>{talentsLabel}</div>
      <div className={styles.talentTree}>
        {levels.map(level => {
          const talent = talents[level];
          if (!talent) return null;
          const parts = talent.split(' / ');
          return (
            <div key={level} className={styles.talentRow}>
              <div className={`${styles.talentOption} ${styles.recommended}`}>
                {parts[0] || talent}
              </div>
              <div className={styles.talentLevel}>Lvl {level}</div>
              <div className={styles.talentOption}>
                {parts[1] || '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HeroBuildClientProps {
  hero: HeroBuildData;
  heroStats: HeroStats | null;
  builds: HeroBuildEntry[];
}

export default function HeroBuildClient({ hero, heroStats, builds }: HeroBuildClientProps) {
  const [activeBuild, setActiveBuild] = useState(0);
  const build = builds[activeBuild];
  const { t } = useLocale();

  const attrKey = heroStats?.primary_attr as AttrKey | undefined;
  const attrClass = (attrKey && ATTR_CLASS[attrKey]) || styles.attrAll;
  const attrLabel = (attrKey && ATTR_LABEL[attrKey]) || 'Unknown';

  return (
    <div className={styles.heroPage}>
      <div className={styles.breadcrumb}>
        <Link href="/builds">{t('builds.breadcrumb')}</Link>
        <span>/</span>
        <span>{hero.name}</span>
      </div>

      <div className={styles.heroHeader}>
        <div className={styles.heroAvatar}>
          {heroStats?.image && (
            <img src={heroStats.image} alt={hero.name} />
          )}
        </div>
        <div className={styles.heroMeta}>
          <h1 className={styles.heroTitle}>{hero.name}</h1>
          <div className={styles.heroSubInfo}>
            <span><strong>{hero.lane}</strong></span>
            <span className={`${styles.attrBadge} ${attrClass}`}>{attrLabel}</span>
            {heroStats?.winrate && (
              <span>Winrate: <strong style={{ color: heroStats.winrateNum >= 50 ? '#4caf50' : '#ff4c4c' }}>
                {heroStats.winrate}
              </strong></span>
            )}
            {heroStats && (heroStats.pickrate ?? 0) > 0 && (
              <span>Picks: <strong>{heroStats.pickrate.toLocaleString()}</strong></span>
            )}
          </div>
        </div>
      </div>

      {builds.length > 1 && (
        <div className={styles.buildTabs}>
          {builds.map((b, i) => (
            <button
              key={i}
              className={`${styles.buildTab} ${activeBuild === i ? styles.buildTabActive : ''}`}
              onClick={() => setActiveBuild(i)}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.buildStats}>
        <div className={styles.buildStat}>
          <span className={styles.buildStatLabel}>Winrate</span>
          <span className={styles.buildStatValue} style={{ color: build.winrate >= 50 ? '#4caf50' : '#ff4c4c' }}>
            {build.winrate}%
          </span>
        </div>
        <div className={styles.buildStat}>
          <span className={styles.buildStatLabel}>Pickrate</span>
          <span className={styles.buildStatValue}>{build.pickrate}%</span>
        </div>
        <div className={styles.buildStat}>
          <span className={styles.buildStatLabel}>{t('builds.difficulty')}</span>
          <span className={styles.buildStatValue}>{hero.difficulty}</span>
        </div>
      </div>

      <ItemsRow label={t('builds.startingItems')} items={build.starting_items} />
      <ItemsRow label={t('builds.earlyGame')} items={build.early_items} />
      <ItemsRow label={t('builds.midGame')} items={build.mid_items} />
      <ItemsRow label={t('builds.lateGame')} items={build.late_items} />

      {build.situational_items && build.situational_items.length > 0 && (
        <div className={styles.situationalSection}>
          <div className={styles.sectionTitle}>{t('builds.situationalItems')}</div>
          <div className={styles.itemsRow}>
            {build.situational_items.map((item, i) => (
              <div key={i} className={styles.itemSlot}>
                <div className={styles.itemIcon}>
                  <img
                    src={getItemIconUrl(item)}
                    alt={formatItemName(item)}
                    loading="lazy"
                  />
                </div>
                <span className={styles.itemName}>{formatItemName(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {build.neutral_item && (
        <div className={styles.neutralSection}>
          <div className={styles.sectionTitle}>{t('builds.neutralItem')}</div>
          <div className={styles.neutralItem}>
            <img
              className={styles.neutralItemIcon}
              src={getItemIconUrl(build.neutral_item)}
              alt={formatItemName(build.neutral_item)}
              loading="lazy"
            />
            <span className={styles.neutralItemName}>{formatItemName(build.neutral_item)}</span>
          </div>
        </div>
      )}

      <AbilityBuildTable abilityBuild={build.ability_build} skillOrderLabel={t('builds.skillOrder')} />

      <TalentsSection talents={build.talents} talentsLabel={t('builds.talents')} />
    </div>
  );
}
