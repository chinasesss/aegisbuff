import { OpenDotaHero } from '../types/index';

// Valve CDN Base URL
export const VALVE_CDN = 'https://cdn.cloudflare.steamstatic.com';

/**
 * Returns clean hero image URL from OpenDota img path or Valve CDN
 */
export function getHeroImageUrl(imgOrName?: string): string {
  if (!imgOrName) {
    return 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/invoker.png';
  }
  if (imgOrName.startsWith('http')) return imgOrName;
  if (imgOrName.startsWith('/apps/dota2')) return `${VALVE_CDN}${imgOrName}`;
  // If hero system name like npc_dota_hero_antimage
  const cleanName = imgOrName.replace('npc_dota_hero_', '');
  return `${VALVE_CDN}/apps/dota2/images/dota_react/heroes/${cleanName}.png`;
}

/**
 * Returns item image URL from item name or ID
 */
export function getItemImageUrl(itemName?: string): string {
  if (!itemName) {
    return `${VALVE_CDN}/apps/dota2/images/dota_react/items/emptyitembg.png`;
  }
  const cleanName = itemName.replace('item_', '');
  return `${VALVE_CDN}/apps/dota2/images/dota_react/items/${cleanName}.png`;
}

/**
 * Converts rank_tier number into badge and stars
 * e.g. 11 = Herald 1, 80 = Immortal
 */
export function formatRankTier(rankTier?: number, leaderboardRank?: number | null): {
  tierName: string;
  badgeName: string;
  stars: number;
  isImmortal: boolean;
  color: string;
} {
  if (!rankTier) {
    return {
      tierName: 'Uncalibrated',
      badgeName: 'Uncalibrated',
      stars: 0,
      isImmortal: false,
      color: '#ae8786',
    };
  }

  const tier = Math.floor(rankTier / 10);
  const stars = rankTier % 10;

  const tiers: Record<number, { name: string; color: string }> = {
    1: { name: 'Herald', color: '#ae8786' },
    2: { name: 'Guardian', color: '#89ceff' },
    3: { name: 'Crusader', color: '#10b981' },
    4: { name: 'Archon', color: '#009ada' },
    5: { name: 'Legend', color: '#ffb3b1' },
    6: { name: 'Ancient', color: '#ff525b' },
    7: { name: 'Divine', color: '#ffc640' },
    8: { name: 'Immortal', color: '#f9bd22' },
  };

  const currentTier = tiers[tier] || { name: 'Unknown', color: '#e3e2e8' };
  const isImmortal = tier >= 8;

  let displayName = `${currentTier.name} ${stars > 0 ? stars : ''}`.trim();
  if (isImmortal && leaderboardRank) {
    displayName = `Immortal #${leaderboardRank}`;
  }

  return {
    tierName: displayName,
    badgeName: currentTier.name,
    stars,
    isImmortal,
    color: currentTier.color,
  };
}

/**
 * Formats match duration (seconds) to mm:ss
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Formats unix timestamp to relative time (e.g. 2 hours ago)
 */
export function formatTimeAgo(unixTimestamp: number): string {
  if (!unixTimestamp) return 'Recently';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixTimestamp;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

/**
 * Calculate KDA ratio string
 */
export function calculateKda(kills: number, deaths: number, assists: number): string {
  const d = deaths === 0 ? 1 : deaths;
  return ((kills + assists) / d).toFixed(2);
}

/**
 * Formats game mode ID
 */
export function getGameModeName(gameModeId?: number): string {
  const modes: Record<number, string> = {
    1: 'All Pick',
    2: "Captains Mode",
    3: 'Random Draft',
    4: 'Single Draft',
    5: 'All Random',
    22: 'Ranked All Pick',
    23: 'Turbo',
  };
  return modes[gameModeId || 0] || 'Ranked Match';
}

/**
 * Converts primary attribute key to human label and badge color
 */
export function getAttributeMeta(attr: string): { label: string; color: string; bg: string } {
  switch (attr) {
    case 'str':
      return { label: 'Strength', color: '#ff525b', bg: 'rgba(255, 82, 91, 0.15)' };
    case 'agi':
      return { label: 'Agility', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    case 'int':
      return { label: 'Intelligence', color: '#009ada', bg: 'rgba(0, 154, 218, 0.15)' };
    case 'all':
    default:
      return { label: 'Universal', color: '#ffc640', bg: 'rgba(255, 198, 64, 0.15)' };
  }
}
