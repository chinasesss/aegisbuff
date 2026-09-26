import {
  MatchDetailData, OpenDotaHero, PlayerHeroStat, PlayerMatchSummary,
  PlayerProfileData, PlayerTotalStat, PlayerWinLossData, ProMatchItem,
  ProPlayerItem, SearchPlayerItem, DotaConstantItem,
} from '../types';
import { apiClient, CACHE_TTL } from './apiClient';

class DotaService {
  getHeroStats() { return apiClient.get<OpenDotaHero[]>('/api/heroes', CACHE_TTL.LONG); }
  searchPlayers(query: string) {
    if (!query.trim()) return Promise.resolve([] as SearchPlayerItem[]);
    return apiClient.get<SearchPlayerItem[]>(`/api/search?q=${encodeURIComponent(query.trim())}`, CACHE_TTL.SHORT);
  }
  getPlayer(accountId: number) { return apiClient.get<PlayerProfileData>(`/api/players/${accountId}`, CACHE_TTL.MEDIUM); }
  getPlayerWinLoss(accountId: number) { return apiClient.get<PlayerWinLossData>(`/api/players/${accountId}/wl`, CACHE_TTL.MEDIUM); }
  getPlayerMatches(accountId: number, params?: { limit?: number; hero_id?: number; win?: number }) {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.hero_id) qs.set('hero_id', String(params.hero_id));
    if (params?.win !== undefined) qs.set('win', String(params.win));
    return apiClient.get<PlayerMatchSummary[]>(`/api/players/${accountId}/matches?${qs}`, CACHE_TTL.SHORT);
  }
  getPlayerHeroes(accountId: number) { return apiClient.get<PlayerHeroStat[]>(`/api/players/${accountId}/heroes`, CACHE_TTL.MEDIUM); }
  getPlayerTotals(accountId: number) { return apiClient.get<PlayerTotalStat[]>(`/api/players/${accountId}/totals`, CACHE_TTL.LONG); }
  getMatch(matchId: number | string) { return apiClient.get<MatchDetailData>(`/api/matches/${matchId}`, CACHE_TTL.PERMANENT); }
  getProMatches() { return apiClient.get<ProMatchItem[]>('/api/pro/matches', CACHE_TTL.SHORT); }
  getProPlayers() { return apiClient.get<ProPlayerItem[]>('/api/pro/players', CACHE_TTL.LONG); }
  getHeroMatchups(heroId: number) { return apiClient.get<{ hero_id: number; games_played: number; wins: number }[]>(`/api/heroes/${heroId}/matchups`, CACHE_TTL.MEDIUM); }
  getConstants<T>(resource: string) { return apiClient.get<T>(`/api/constants/${resource}`, CACHE_TTL.LONG); }
  getItemConstants() { return this.getConstants<Record<string, DotaConstantItem>>('items'); }
  async getAiAnalysis(payload: unknown): Promise<{ summary?: string; findings?: string[]; recommendations?: string[] }> {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ai/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
}
export const dotaService = new DotaService();
