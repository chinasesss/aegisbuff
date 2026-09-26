export type PageRoute =
  | 'home'
  | 'players'
  | 'player'
  | 'matches'
  | 'match'
  | 'heroes'
  | 'hero'
  | 'rankings'
  | 'builds'
  | 'meta'
  | 'esports'
  | 'ai-coach'
  | 'favorites'
  | 'login'
  | 'register'
  | 'profile'
  | 'settings';

export type HeroAttribute = 'str' | 'agi' | 'int' | 'all';

export interface OpenDotaHero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: 'str' | 'agi' | 'int' | 'all';
  attack_type: string;
  roles: string[];
  img: string;
  icon: string;
  base_health: number;
  base_mana: number;
  base_armor: number;
  move_speed: number;
  pro_win?: number;
  pro_pick?: number;
  pro_ban?: number;
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
  turbo_picks?: number;
  turbo_wins?: number;
}

export interface PlayerProfileData {
  tracked_until?: string;
  solo_competitive_rank?: number;
  competitive_rank?: number;
  rank_tier?: number;
  leaderboard_rank?: number | null;
  mmr_estimate?: {
    estimate?: number;
  };
  profile: {
    account_id: number;
    personaname: string;
    name?: string;
    plus?: boolean;
    cheese?: number;
    steamid?: string;
    avatar: string;
    avatarmedium: string;
    avatarfull: string;
    profileurl: string;
    last_login?: string;
    loccountrycode?: string;
    is_contributor?: boolean;
    is_subscriber?: boolean;
  };
}

export interface PlayerWinLossData {
  win: number;
  lose: number;
}

export interface PlayerMatchSummary {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  game_mode: number;
  lobby_type: number;
  hero_id: number;
  start_time: number;
  version?: number;
  kills: number;
  deaths: number;
  assists: number;
  skill?: number;
  average_rank?: number;
  leaver_status: number;
  party_size?: number;
}

export interface PlayerHeroStat {
  hero_id: string;
  last_played: number;
  games: number;
  win: number;
  with_games: number;
  with_win: number;
  against_games: number;
  against_win: number;
}

export interface PlayerTotalStat {
  field: string;
  n: number;
  sum: number;
}

export interface MatchPlayerDetail {
  account_id: number | null;
  player_slot: number;
  hero_id: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
  backpack_0?: number;
  backpack_1?: number;
  backpack_2?: number;
  item_neutral?: number;
  kills: number;
  deaths: number;
  assists: number;
  leaver_status: number;
  last_hits: number;
  denies: number;
  gold_per_min: number;
  xp_per_min: number;
  gold_spent?: number;
  hero_damage?: number;
  tower_damage?: number;
  hero_healing?: number;
  level: number;
  net_worth?: number;
  personaname?: string;
  name?: string;
  radiant_win?: boolean;
}

export interface MatchDetailData {
  match_id: number;
  barracks_status_dire?: number;
  barracks_status_radiant?: number;
  cluster?: number;
  dire_score: number;
  radiant_score: number;
  duration: number;
  first_blood_time?: number;
  game_mode: number;
  radiant_win: boolean;
  radiant_gold_adv?: number[];
  radiant_xp_adv?: number[];
  start_time: number;
  tower_status_dire?: number;
  tower_status_radiant?: number;
  patch?: number;
  region?: number;
  replay_url?: string;
  players: MatchPlayerDetail[];
}

export interface ProMatchItem {
  match_id: number;
  duration: number;
  start_time: number;
  radiant_team_id?: number;
  radiant_name: string;
  dire_team_id?: number;
  dire_name: string;
  league_name: string;
  series_type?: number;
  radiant_score: number;
  dire_score: number;
  radiant_win: boolean;
}

export interface ProPlayerItem {
  account_id: number;
  steamid?: string;
  avatarfull?: string;
  personaname?: string;
  name?: string;
  team_id?: number;
  team_name?: string;
  team_tag?: string;
  country_code?: string;
  is_pro?: boolean;
  locked_until?: number;
}

export interface SearchPlayerItem {
  account_id: number;
  personaname: string;
  avatarfull: string;
  last_match_time?: string;
  similarity?: number;
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  connectedAccountId?: number;
  connectedPlayerName?: string;
  avatarUrl?: string;
  favorites: {
    players: number[];
    heroes: number[];
    matches: number[];
    builds: string[];
  };
}

export interface DotaConstantItem {
  id: number;
  name: string;
  cost?: number;
  secret_shop?: number;
  side_shop?: number;
  recipe?: number;
  localized_name?: string;
}
