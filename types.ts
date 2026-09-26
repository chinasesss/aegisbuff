export type PageType = 
  | 'home' 
  | 'players' 
  | 'matches' 
  | 'heroes' 
  | 'rankings' 
  | 'builds' 
  | 'meta' 
  | 'esports' 
  | 'ai-coach';

export type HeroAttribute = 'strength' | 'agility' | 'intelligence' | 'universal';
export type HeroRole = 'Carry' | 'Mid' | 'Offlane' | 'Support' | 'Hard Support';

export interface HeroSummary {
  id: string;
  name: string;
  title: string;
  attribute: HeroAttribute;
  tier: 'GOD TIER' | 'S-TIER' | 'A-TIER' | 'B-TIER';
  winRate: number;
  winRateDelta: number;
  pickRate: number;
  banRate: number;
  avatarUrl: string;
  complexity: 1 | 2 | 3;
  primaryPosition: string;
  positionPriority: { pos: string; pct: number }[];
  baseStats: {
    str: string;
    agi: string;
    int: string;
    range: number;
    ms: number;
    armor: number;
  };
  facets: {
    key: string;
    name: string;
    winRate: number;
    description: string;
  }[];
  worstMatchups: {
    hero: string;
    role: string;
    matches: number;
    adv: number;
    enemyWr: number;
    reason: string;
    avatarUrl: string;
  }[];
  bestMatchups: {
    hero: string;
    role: string;
    matches: number;
    adv: number;
    winRate: number;
    reason: string;
    avatarUrl: string;
  }[];
  draftSynergies: {
    hero: string;
    comboName: string;
    winRate: number;
    description: string;
  }[];
  itemization: {
    phase: string;
    winRateOrTiming: string;
    items: { name: string; icon: string }[];
    notes: string;
  }[];
  talents: {
    level: number;
    left: { title: string; wr: string; pick: string };
    right: { title: string; wr: string; pick: string };
  }[];
  skillBuilds: {
    name: string;
    stats: string;
    sequence: string[];
    description: string;
  }[];
  proMatches: {
    player: string;
    team: string;
    matchId: string;
    event: string;
    duration: string;
    outcome: 'VICTORY' | 'DEFEAT';
    faction: 'Radiant' | 'Dire';
    kda: string;
    gpmXpm: string;
    heroDmg: string;
  }[];
}

export interface PlayerProfile {
  id: string;
  steamId: string;
  name: string;
  team: string;
  rank: number;
  mmr: number;
  region: string;
  roles: string[];
  winRate: number;
  totalMatches: number;
  avatarUrl: string;
  recentMatches: {
    matchId: string;
    hero: string;
    heroAvatar: string;
    outcome: 'VICTORY' | 'DEFEAT';
    kda: string;
    duration: string;
    timeAgo: string;
    items: string[];
    gpm: number;
    xpm: number;
  }[];
  topHeroes: {
    name: string;
    avatar: string;
    games: number;
    winRate: number;
    kda: string;
  }[];
}

export interface LiveMatchData {
  id: string;
  tournament: string;
  gameNumber: number;
  duration: string;
  radiantScore: number;
  direScore: number;
  radiantTeam: {
    name: string;
    logoUrl: string;
    netWorthLead?: number;
    players: {
      name: string;
      hero: string;
      avatarUrl: string;
      kda: string;
      netWorth: string;
    }[];
  };
  direTeam: {
    name: string;
    logoUrl: string;
    netWorthLead?: number;
    players: {
      name: string;
      hero: string;
      avatarUrl: string;
      kda: string;
      netWorth: string;
    }[];
  };
  winExpectancy: {
    radiant: number;
    dire: number;
  };
  roshanTimer: string;
  spectators: number;
  goldAdvantage: number;
}

export type {
  PageRoute,
  OpenDotaHero,
  PlayerProfileData,
  PlayerWinLossData,
  PlayerMatchSummary,
  PlayerHeroStat,
  PlayerTotalStat,
  MatchPlayerDetail,
  MatchDetailData,
  ProMatchItem,
  ProPlayerItem,
  SearchPlayerItem,
  UserAccount,
  DotaConstantItem,
} from './types/index';

