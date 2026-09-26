import React, { useState, useEffect } from 'react';
import { dotaService } from '../services/dotaService';
import { authService } from '../services/authService';
import {
  OpenDotaHero,
  PageRoute,
  PlayerHeroStat,
  PlayerMatchSummary,
  PlayerProfileData,
  PlayerWinLossData,
} from '../types/index';
import {
  calculateKda,
  formatDuration,
  formatRankTier,
  formatTimeAgo,
  getGameModeName,
  getHeroImageUrl,
} from '../utils/dotaHelpers';
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/common/SkeletonLoader';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface PlayerProfilePageProps {
  accountId: number;
  onNavigate: (page: PageRoute) => void;
  onSelectMatch: (matchId: number) => void;
  onSelectHero: (heroId: number) => void;
}

export const PlayerProfilePage: React.FC<PlayerProfilePageProps> = ({
  accountId,
  onNavigate,
  onSelectMatch,
  onSelectHero,
}) => {
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [winLoss, setWinLoss] = useState<PlayerWinLossData | null>(null);
  const [matches, setMatches] = useState<PlayerMatchSummary[]>([]);
  const [heroes, setHeroes] = useState<PlayerHeroStat[]>([]);
  const [allHeroMeta, setAllHeroMeta] = useState<Map<number, OpenDotaHero>>(new Map());

  const [activeTab, setActiveTab] = useState<'matches' | 'heroes' | 'records'>('matches');
  const [matchFilter, setMatchFilter] = useState<'all' | 'win' | 'lose'>('all');
  const [heroSort, setHeroSort] = useState<'games' | 'winRate' | 'kda'>('games');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const fetchPlayerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [playerData, wlData, matchesData, heroStatsData, allHeroes] = await Promise.all([
        dotaService.getPlayer(accountId),
        dotaService.getPlayerWinLoss(accountId),
        dotaService.getPlayerMatches(accountId, { limit: 50 }),
        dotaService.getPlayerHeroes(accountId),
        dotaService.getHeroStats(),
      ]);

      setProfile(playerData);
      setWinLoss(wlData);
      setMatches(matchesData);
      setHeroes(heroStatsData);

      const map = new Map<number, OpenDotaHero>();
      allHeroes.forEach((h: OpenDotaHero) => map.set(h.id, h));
      setAllHeroMeta(map);

      setIsFavorited(authService.isPlayerFavorited(accountId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Player not found or telemetry unavailable.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData();
  }, [accountId]);

  const handleToggleFavorite = () => {
    const next = authService.toggleFavoritePlayer(accountId);
    setIsFavorited(next);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">
        <SkeletonCard />
        <SkeletonTable rows={8} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-12">
        <ErrorMessage
          title="Player Not Found"
          message={error || 'Unable to load profile data for this account ID. Please ensure match history is public in Dota 2 settings.'}
          onRetry={fetchPlayerData}
        />
      </div>
    );
  }

  const totalMatches = (winLoss?.win || 0) + (winLoss?.lose || 0);
  const winRate = totalMatches > 0 ? (((winLoss?.win || 0) / totalMatches) * 100).toFixed(1) : '0';
  const rankInfo = formatRankTier(profile.rank_tier, profile.leaderboard_rank);

  // Filter matches
  const filteredMatches = matches.filter((m) => {
    const isRadiant = m.player_slot < 128;
    const won = (isRadiant && m.radiant_win) || (!isRadiant && !m.radiant_win);
    if (matchFilter === 'win') return won;
    if (matchFilter === 'lose') return !won;
    return true;
  });

  const paginatedMatches = filteredMatches.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredMatches.length / pageSize);

  // Sort heroes
  const sortedHeroes = [...heroes].sort((a, b) => {
    if (heroSort === 'winRate') {
      const wrA = a.games > 0 ? a.win / a.games : 0;
      const wrB = b.games > 0 ? b.win / b.games : 0;
      return wrB - wrA;
    }
    return b.games - a.games;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 pb-20 pt-4 flex flex-col gap-6">
      {/* Header Profile Dossier */}
      <div className="relative p-6 rounded-2xl bg-[#1a1b20] border border-white/[0.06] overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff525b]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl bg-[#0d0e12]">
              <img
                src={profile.profile.avatarfull}
                alt={profile.profile.personaname}
                className="w-full h-full object-cover"
              />
              {profile.profile.plus && (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-[#ffc640] text-[#402d00] font-['JetBrains_Mono'] text-[9px] font-bold">
                  DOTA PLUS
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="font-['Space_Grotesk'] text-2xl lg:text-3xl font-extrabold text-white">
                  {profile.profile.name || profile.profile.personaname}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded font-['JetBrains_Mono'] text-[11px] font-bold flex items-center gap-1 border"
                  style={{ color: rankInfo.color, borderColor: `${rankInfo.color}40`, backgroundColor: `${rankInfo.color}15` }}
                >
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  {rankInfo.tierName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[12px] font-['Inter'] text-[#e7bcbb]/80">
                <span>Account ID: <strong className="font-['JetBrains_Mono'] text-white">{profile.profile.account_id}</strong></span>
                <span>•</span>
                <span>Region: <strong className="text-white">{profile.profile.loccountrycode || 'Global'}</strong></span>
                {profile.profile.profileurl && (
                  <>
                    <span>•</span>
                    <a
                      href={profile.profile.profileurl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#89ceff] hover:underline flex items-center gap-1"
                    >
                      <span>Steam Profile</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`px-3.5 py-2 rounded-xl font-['Space_Grotesk'] text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isFavorited
                  ? 'bg-[#ff525b]/20 border-[#ff525b] text-[#ffb3b1]'
                  : 'bg-[#292a2e] border-white/5 text-white hover:bg-[#343439]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isFavorited ? 'bookmark_added' : 'bookmark_border'}
              </span>
              <span>{isFavorited ? 'Favorited' : 'Favorite Player'}</span>
            </button>

            <button
              onClick={() => onNavigate('ai-coach')}
              className="px-4 py-2 rounded-xl bg-[#ff525b] hover:bg-[#ff404a] text-white font-['Space_Grotesk'] text-[12px] font-bold flex items-center gap-1.5 shadow-lg shadow-[#ff525b]/25 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Audit with AI Coach</span>
            </button>
          </div>
        </div>

        {/* Real KPI Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/[0.06]">
          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-white/5">
            <span className="font-['Space_Grotesk'] text-[10px] uppercase text-[#e7bcbb]/60 font-bold block">
              Estimated MMR
            </span>
            <span className="font-['JetBrains_Mono'] text-[24px] font-black text-[#ffc640]">
              {profile.mmr_estimate?.estimate ? profile.mmr_estimate.estimate.toLocaleString() : profile.leaderboard_rank ? '11,450+' : 'Unranked'}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#e7bcbb]/60 block mt-0.5">
              OpenDota Rating Sync
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-white/5">
            <span className="font-['Space_Grotesk'] text-[10px] uppercase text-[#e7bcbb]/60 font-bold block">
              Lifetime Win Rate
            </span>
            <span className="font-['JetBrains_Mono'] text-[24px] font-black text-white">
              {winRate}%
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#10b981] block mt-0.5">
              {winLoss?.win || 0}W - {winLoss?.lose || 0}L
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-white/5">
            <span className="font-['Space_Grotesk'] text-[10px] uppercase text-[#e7bcbb]/60 font-bold block">
              Total Matches
            </span>
            <span className="font-['JetBrains_Mono'] text-[24px] font-black text-white">
              {totalMatches.toLocaleString()}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#89ceff] block mt-0.5">
              Parsed Replays
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-white/5">
            <span className="font-['Space_Grotesk'] text-[10px] uppercase text-[#e7bcbb]/60 font-bold block">
              Recent Form (50G)
            </span>
            <span className="font-['JetBrains_Mono'] text-[24px] font-black text-[#10b981]">
              {matches.filter((m) => (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win)).length} W
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#e7bcbb]/60 block mt-0.5">
              Last 50 Evaluated Games
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-lg font-['Space_Grotesk'] text-[12px] uppercase font-bold transition-all cursor-pointer ${
            activeTab === 'matches'
              ? 'bg-[#1f1f24] text-white border border-[#ff525b]/30'
              : 'text-[#e7bcbb]/70 hover:text-white'
          }`}
        >
          Match History ({filteredMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('heroes')}
          className={`px-4 py-2 rounded-lg font-['Space_Grotesk'] text-[12px] uppercase font-bold transition-all cursor-pointer ${
            activeTab === 'heroes'
              ? 'bg-[#1f1f24] text-white border border-[#ff525b]/30'
              : 'text-[#e7bcbb]/70 hover:text-white'
          }`}
        >
          Hero Performance ({heroes.length})
        </button>
      </div>

      {/* TAB 1: MATCH HISTORY TABLE */}
      {activeTab === 'matches' && (
        <div className="flex flex-col gap-4">
          {/* Filters Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#1a1b20] p-1 rounded-xl border border-white/5">
              {(['all', 'win', 'lose'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setMatchFilter(mode);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-['Space_Grotesk'] text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    matchFilter === mode ? 'bg-[#ff525b] text-white shadow-sm' : 'text-[#e7bcbb]/60 hover:text-white'
                  }`}
                >
                  {mode === 'all' ? 'All Matches' : mode === 'win' ? 'Victories Only' : 'Defeats Only'}
                </button>
              ))}
            </div>

            <span className="font-['JetBrains_Mono'] text-[12px] text-[#e7bcbb]/60">
              Page {page} of {Math.max(1, totalPages)}
            </span>
          </div>

          {/* Matches Table */}
          <div className="bg-[#1a1b20] rounded-xl overflow-hidden border border-white/[0.05] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-[#121317] text-[#e7bcbb]/60 font-['Space_Grotesk'] text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Hero Played</th>
                    <th className="py-3 px-3">K / D / A</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Game Mode</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] font-['Inter'] text-[13px] text-white">
                  {paginatedMatches.map((m) => {
                    const isRadiant = m.player_slot < 128;
                    const won = (isRadiant && m.radiant_win) || (!isRadiant && !m.radiant_win);
                    const hero = allHeroMeta.get(m.hero_id);

                    return (
                      <tr
                        key={m.match_id}
                        onClick={() => onSelectMatch(m.match_id)}
                        className="hover:bg-[#292a2e]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[11px] font-bold uppercase ${
                              won ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#93000a]/30 text-[#ffb4ab]'
                            }`}
                          >
                            {won ? 'Victory' : 'Defeat'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getHeroImageUrl(hero?.img || hero?.name)}
                              alt={hero?.localized_name || 'Hero'}
                              className="w-9 h-9 rounded object-cover border border-white/10"
                            />
                            <div>
                              <span className="font-['Space_Grotesk'] text-[14px] font-bold text-white group-hover:text-[#ff525b] transition-colors block">
                                {hero?.localized_name || `Hero #${m.hero_id}`}
                              </span>
                              <span className="font-['JetBrains_Mono'] text-[10px] text-[#e7bcbb]/60">
                                {isRadiant ? 'Radiant' : 'Dire'} Slot
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-['JetBrains_Mono'] text-[13px]">
                          <span className="font-bold text-white">
                            {m.kills} / <span className="text-[#ffb4ab]">{m.deaths}</span> / {m.assists}
                          </span>
                          <span className="text-[10px] text-[#e7bcbb]/60 block">
                            {calculateKda(m.kills, m.deaths, m.assists)} KDA
                          </span>
                        </td>

                        <td className="py-3 px-3 font-['JetBrains_Mono'] text-[13px] text-[#e7bcbb]/80">
                          {formatDuration(m.duration)}
                        </td>

                        <td className="py-3 px-3 font-['JetBrains_Mono'] text-[11px] text-[#89ceff]">
                          {getGameModeName(m.game_mode)}
                        </td>

                        <td className="py-3 px-4 font-['JetBrains_Mono'] text-[11px] text-[#e7bcbb]/60">
                          {formatTimeAgo(m.start_time)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-wider text-[#ff525b] font-bold group-hover:underline">
                            Inspect #{m.match_id} →
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-[#121317] border-t border-white/[0.04] flex items-center justify-between">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-[#1f1f24] hover:bg-[#292a2e] disabled:opacity-30 text-[12px] font-['Space_Grotesk'] text-white transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#e7bcbb]/60">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded bg-[#1f1f24] hover:bg-[#292a2e] disabled:opacity-30 text-[12px] font-['Space_Grotesk'] text-white transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HERO PERFORMANCE TABLE */}
      {activeTab === 'heroes' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-['Space_Grotesk'] text-[14px] text-white font-bold">
              Hero Pool Performance Records
            </span>
            <div className="flex items-center gap-2">
              <span className="font-['Space_Grotesk'] text-[11px] text-[#e7bcbb]/60 uppercase font-bold">Sort:</span>
              <button
                onClick={() => setHeroSort('games')}
                className={`px-2.5 py-1 rounded text-[11px] font-['Space_Grotesk'] uppercase font-bold ${
                  heroSort === 'games' ? 'bg-[#ff525b] text-white' : 'bg-[#1a1b20] text-[#e7bcbb]'
                }`}
              >
                Most Played
              </button>
              <button
                onClick={() => setHeroSort('winRate')}
                className={`px-2.5 py-1 rounded text-[11px] font-['Space_Grotesk'] uppercase font-bold ${
                  heroSort === 'winRate' ? 'bg-[#ff525b] text-white' : 'bg-[#1a1b20] text-[#e7bcbb]'
                }`}
              >
                Highest Win Rate
              </button>
            </div>
          </div>

          <div className="bg-[#1a1b20] rounded-xl overflow-hidden border border-white/[0.05] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-[#121317] text-[#e7bcbb]/60 font-['Space_Grotesk'] text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Hero</th>
                    <th className="py-3 px-3">Matches</th>
                    <th className="py-3 px-3">Wins</th>
                    <th className="py-3 px-3">Losses</th>
                    <th className="py-3 px-4">Win Rate %</th>
                    <th className="py-3 px-4 text-right">Hero Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] font-['Inter'] text-[13px] text-white">
                  {sortedHeroes.slice(0, 25).map((h) => {
                    const hero = allHeroMeta.get(Number(h.hero_id));
                    const heroWr = h.games > 0 ? ((h.win / h.games) * 100).toFixed(1) : '0';

                    return (
                      <tr
                        key={h.hero_id}
                        onClick={() => {
                          if (hero) onSelectHero(hero.id);
                        }}
                        className="hover:bg-[#292a2e]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getHeroImageUrl(hero?.img || hero?.name)}
                              alt={hero?.localized_name || 'Hero'}
                              className="w-10 h-10 rounded object-cover border border-white/10"
                            />
                            <div>
                              <span className="font-['Space_Grotesk'] text-[14px] font-bold text-white group-hover:text-[#ff525b] transition-colors block">
                                {hero?.localized_name || `Hero #${h.hero_id}`}
                              </span>
                              <span className="font-['JetBrains_Mono'] text-[10px] text-[#89ceff]">
                                {hero?.primary_attr.toUpperCase()} PRIMARY
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-['JetBrains_Mono'] text-[14px] font-bold">
                          {h.games}
                        </td>

                        <td className="py-3 px-3 font-['JetBrains_Mono'] text-[13px] text-[#10b981] font-bold">
                          {h.win}
                        </td>

                        <td className="py-3 px-3 font-['JetBrains_Mono'] text-[13px] text-[#ffb4ab]">
                          {h.games - h.win}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 font-['JetBrains_Mono']">
                            <span className="text-[#ffc640] font-bold text-[14px]">{heroWr}%</span>
                          </div>
                          <div className="w-24 h-1.5 bg-[#0d0e12] rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-[#ffc640] h-full rounded-full"
                              style={{ width: `${heroWr}%` }}
                            ></div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-wider text-[#ff525b] font-bold group-hover:underline">
                            View Counters →
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
