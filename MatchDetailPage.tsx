import React, { useState, useEffect } from 'react';
import { dotaService } from '../services/dotaService';
import { authService } from '../services/authService';
import { MatchDetailData, OpenDotaHero, PageRoute } from '../types/index';
import {
  formatDuration,
  formatTimeAgo,
  getGameModeName,
  getHeroImageUrl,
  getItemImageUrl,
} from '../utils/dotaHelpers';
import { SkeletonCard, SkeletonTable } from '../components/common/SkeletonLoader';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface MatchDetailPageProps {
  matchId: number | string;
  onNavigate: (page: PageRoute) => void;
  onSelectPlayer: (accountId: number) => void;
  onSelectHero: (heroId: number) => void;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({
  matchId,
  onNavigate,
  onSelectPlayer,
  onSelectHero,
}) => {
  const [match, setMatch] = useState<MatchDetailData | null>(null);
  const [allHeroMeta, setAllHeroMeta] = useState<Map<number, OpenDotaHero>>(new Map());
  const [itemConstants, setItemConstants] = useState<Record<string, { id: number; name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [chartMode, setChartMode] = useState<'gold' | 'xp'>('gold');

  const fetchMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const [matchData, heroStats, items] = await Promise.all([
        dotaService.getMatch(matchId),
        dotaService.getHeroStats(),
        dotaService.getConstants<Record<string, { id: number; name: string }>>('items').catch(() => ({})),
      ]);

      setMatch(matchData);

      const map = new Map<number, OpenDotaHero>();
      heroStats.forEach((h: OpenDotaHero) => map.set(h.id, h));
      setAllHeroMeta(map);
      setItemConstants(items);

      setIsFavorited(authService.isMatchFavorited(Number(matchId)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Match telemetry could not be loaded.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const handleToggleFavorite = () => {
    const next = authService.toggleFavoriteMatch(Number(matchId));
    setIsFavorited(next);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">
        <SkeletonCard />
        <SkeletonTable rows={10} />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-12">
        <ErrorMessage
          title="Match Not Found"
          message={error || 'Unable to retrieve match replay telemetry. Verify match ID.'}
          onRetry={fetchMatch}
        />
      </div>
    );
  }

  const radiantPlayers = match.players.filter((p: any) => p.player_slot < 128);
  const direPlayers = match.players.filter((p: any) => p.player_slot >= 128);

  const timelineAdv = chartMode === 'gold' ? match.radiant_gold_adv : match.radiant_xp_adv;
  const hasTimeline = timelineAdv && Array.isArray(timelineAdv) && timelineAdv.length > 0;

  // Build SVG path for real gold/xp curve
  const svgWidth = 600;
  const svgHeight = 100;
  let sparklinePath = '';
  let fillPath = '';

  if (hasTimeline) {
    const maxVal = Math.max(1, ...timelineAdv.map((v) => Math.abs(v)));
    const points = timelineAdv.map((val, idx) => {
      const x = (idx / (timelineAdv.length - 1)) * svgWidth;
      // 0 is at y = svgHeight / 2 = 50
      const y = (svgHeight / 2) - (val / maxVal) * (svgHeight / 2 - 10);
      return { x, y };
    });

    sparklinePath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');
    fillPath = `${sparklinePath} L ${svgWidth},${svgHeight / 2} L 0,${svgHeight / 2} Z`;
  }

  const getItemName = (id: number): string | undefined => {
    if (!id) return undefined;
    for (const [name, obj] of Object.entries(itemConstants)) {
      if (obj.id === id) return name;
    }
    return undefined;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 pb-20 pt-4 flex flex-col gap-6">
      {/* Top Match Header Card */}
      <div className="p-6 rounded-2xl bg-[#1a1b20] border border-white/[0.06] shadow-2xl flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded font-['Space_Grotesk'] text-[12px] font-bold uppercase tracking-wider ${
                match.radiant_win ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ff525b]/20 text-[#ffb3b1]'
              }`}
            >
              {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
            </span>
            <span className="font-['Space_Grotesk'] text-[16px] text-white font-bold">
              Match #{match.match_id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-1.5 rounded-lg font-['Space_Grotesk'] text-[11px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer border ${
                isFavorited
                  ? 'bg-[#ff525b]/20 border-[#ff525b] text-[#ffb3b1]'
                  : 'bg-[#292a2e] border-white/5 text-white hover:bg-[#343439]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isFavorited ? 'bookmark_added' : 'bookmark_border'}
              </span>
              <span>{isFavorited ? 'Favorited' : 'Bookmark Match'}</span>
            </button>
          </div>
        </div>

        {/* Score & Specs Row */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Radiant Box */}
          <div className="md:col-span-5 flex items-center justify-between p-4 rounded-xl bg-[#0d0e12] border border-white/5">
            <div>
              <span className="font-['Space_Grotesk'] text-[18px] font-black text-[#10b981] block">
                The Radiant
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#e7bcbb]/60">
                {match.radiant_win ? 'Match Winner' : 'Defeated'}
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[32px] font-black text-white">
              {match.radiant_score}
            </span>
          </div>

          <div className="md:col-span-1 flex flex-col items-center justify-center">
            <span className="font-['Space_Grotesk'] text-[14px] text-white/30 font-black">VS</span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#ffc640] font-bold">
              {formatDuration(match.duration)}
            </span>
          </div>

          {/* Dire Box */}
          <div className="md:col-span-5 flex items-center justify-between p-4 rounded-xl bg-[#0d0e12] border border-white/5">
            <span className="font-['JetBrains_Mono'] text-[32px] font-black text-white order-2 md:order-1">
              {match.dire_score}
            </span>
            <div className="order-1 md:order-2 text-right">
              <span className="font-['Space_Grotesk'] text-[18px] font-black text-[#ff525b] block">
                The Dire
              </span>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#e7bcbb]/60">
                {!match.radiant_win ? 'Match Winner' : 'Defeated'}
              </span>
            </div>
          </div>
        </div>

        {/* Meta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] font-['JetBrains_Mono'] text-[#e7bcbb]/80 pt-2 border-t border-white/[0.04]">
          <div>Game Mode: <strong className="text-white">{getGameModeName(match.game_mode)}</strong></div>
          <div>Duration: <strong className="text-white">{formatDuration(match.duration)}</strong></div>
          <div>Played: <strong className="text-white">{formatTimeAgo(match.start_time)}</strong></div>
          <div>Patch: <strong className="text-[#ffc640]">reported by match data</strong></div>
        </div>
      </div>

      {/* MATCH ANALYTICS: Real Gold & XP Progression Charts */}
      <div className="p-5 rounded-2xl bg-[#1a1b20] border border-white/[0.05] shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
          <div>
            <h3 className="font-['Space_Grotesk'] text-[16px] text-white font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffc640] text-[20px]">timeline</span>
              Match Advantage Progression
            </h3>
            <span className="font-['Inter'] text-[11px] text-[#e7bcbb]/60">
              Positive values indicate Radiant advantage; negative values indicate Dire advantage
            </span>
          </div>

          {hasTimeline && (
            <div className="flex items-center gap-1 bg-[#0d0e12] p-1 rounded-lg">
              <button
                onClick={() => setChartMode('gold')}
                className={`px-3 py-1 rounded text-[11px] font-['Space_Grotesk'] uppercase font-bold cursor-pointer transition-colors ${
                  chartMode === 'gold' ? 'bg-[#ffc640] text-[#402d00]' : 'text-[#e7bcbb]/60 hover:text-white'
                }`}
              >
                Gold Adv
              </button>
              <button
                onClick={() => setChartMode('xp')}
                className={`px-3 py-1 rounded text-[11px] font-['Space_Grotesk'] uppercase font-bold cursor-pointer transition-colors ${
                  chartMode === 'xp' ? 'bg-[#89ceff] text-[#00344d]' : 'text-[#e7bcbb]/60 hover:text-white'
                }`}
              >
                XP Adv
              </button>
            </div>
          )}
        </div>

        {hasTimeline ? (
          <div className="w-full flex flex-col gap-2">
            <div className="h-28 w-full bg-[#0d0e12] rounded-xl p-2 flex items-center justify-center border border-white/5 relative overflow-hidden">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="#343439" strokeWidth="1" strokeDasharray="3,3" />
                <path d={fillPath} fill={chartMode === 'gold' ? 'rgba(255, 198, 64, 0.15)' : 'rgba(137, 206, 255, 0.15)'} />
                <path d={sparklinePath} fill="none" stroke={chartMode === 'gold' ? '#ffc640' : '#89ceff'} strokeWidth="2.5" />
              </svg>
            </div>
            <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#e7bcbb]/60 px-1">
              <span>00:00 (Start)</span>
              <span>Final Difference: {timelineAdv[timelineAdv.length - 1] > 0 ? `+${timelineAdv[timelineAdv.length - 1]}` : timelineAdv[timelineAdv.length - 1]}</span>
              <span>{formatDuration(match.duration)}</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#0d0e12] rounded-xl border border-white/5 text-[13px] font-['Inter'] text-[#e7bcbb]/70">
            <span className="material-symbols-outlined text-[28px] text-[#ffc640] block mb-1">info</span>
            <span>Detailed timeline data unavailable for this match.</span>
          </div>
        )}
      </div>

      {/* RADIANT SCOREBOARD */}
      <div className="bg-[#1a1b20] rounded-xl overflow-hidden border border-white/[0.05] shadow-xl">
        <div className="px-4 py-3 bg-[#1f1f24] flex items-center justify-between border-b border-white/[0.05]">
          <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#10b981]">
            RADIANT TEAM ({match.radiant_score} Kills)
          </span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#10b981] font-bold">
            {match.radiant_win ? 'VICTORY' : 'DEFEATED'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-[#121317] text-[#e7bcbb]/60 font-['Space_Grotesk'] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Player & Hero</th>
                <th className="py-2.5 px-3">K / D / A</th>
                <th className="py-2.5 px-3">Net Worth</th>
                <th className="py-2.5 px-3">LH / DN</th>
                <th className="py-2.5 px-3">GPM / XPM</th>
                <th className="py-2.5 px-3">Hero DMG</th>
                <th className="py-2.5 px-4">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03] font-['Inter'] text-[12px] text-white">
              {radiantPlayers.map((p: any, idx: number) => {
                const hero = allHeroMeta.get(p.hero_id);
                const items = [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5];

                return (
                  <tr key={idx} className="hover:bg-[#292a2e]/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getHeroImageUrl(hero?.img || hero?.name)}
                          alt={hero?.localized_name || 'Hero'}
                          className="w-9 h-9 rounded object-cover border border-white/10 shrink-0"
                          onClick={() => {
                            if (hero) onSelectHero(hero.id);
                          }}
                        />
                        <div className="truncate">
                          {p.account_id ? (
                            <button
                              onClick={() => onSelectPlayer(p.account_id!)}
                              className="font-['Space_Grotesk'] font-bold text-white hover:text-[#ff525b] transition-colors truncate block text-left cursor-pointer"
                            >
                              {p.name || p.personaname || `Player ${idx + 1}`}
                            </button>
                          ) : (
                            <span className="font-['Space_Grotesk'] font-semibold text-white/80 truncate block">
                              {p.name || p.personaname || 'Anonymous'}
                            </span>
                          )}
                          <span className="font-['JetBrains_Mono'] text-[10px] text-[#89ceff]">
                            {hero?.localized_name || `Hero #${p.hero_id}`} · Lv {p.level}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] font-bold">
                      {p.kills} / <span className="text-[#ffb4ab]">{p.deaths}</span> / {p.assists}
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-[#ffc640] font-bold">
                      {p.net_worth ? `${(p.net_worth / 1000).toFixed(1)}k` : `${((p.gold_spent || 0) / 1000).toFixed(1)}k`}
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-[#e7bcbb]/80">
                      {p.last_hits} / {p.denies}
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-[#89ceff]">
                      {p.gold_per_min} / {p.xp_per_min}
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-[#ffb3b1] font-bold">
                      {p.hero_damage ? `${(p.hero_damage / 1000).toFixed(1)}k` : '-'}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1">
                        {items.map((itId, i) => (
                          <div
                            key={i}
                            className="w-7 h-5 rounded bg-[#0d0e12] overflow-hidden border border-white/5 flex items-center justify-center shrink-0"
                            title={getItemName(itId) || 'Item'}
                          >
                            {itId > 0 ? (
                              <img
                                src={getItemImageUrl(getItemName(itId))}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIRE SCOREBOARD */}
      <div className="bg-[#1a1b20] rounded-xl overflow-hidden border border-white/[0.05] shadow-xl">
        <div className="px-4 py-3 bg-[#1f1f24] flex items-center justify-between border-b border-white/[0.05]">
          <span className="font-['Space_Grotesk'] text-[14px] font-bold text-[#ff525b]">
            DIRE TEAM ({match.dire_score} Kills)
          </span>
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#ffb3b1] font-bold">
            {!match.radiant_win ? 'VICTORY' : 'DEFEATED'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-[#121317] text-[#e7bcbb]/60 font-['Space_Grotesk'] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Player & Hero</th>
                <th className="py-2.5 px-3">K / D / A</th>
                <th className="py-2.5 px-3">Net Worth</th>
                <th className="py-2.5 px-3">LH / DN</th>
                <th className="py-2.5 px-3">GPM / XPM</th>
                <th className="py-2.5 px-3">Hero DMG</th>
                <th className="py-2.5 px-4">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03] font-['Inter'] text-[12px] text-white">
              {direPlayers.map((p: any, idx: number) => {
                const hero = allHeroMeta.get(p.hero_id);
                const items = [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5];

                return (
                  <tr key={idx} className="hover:bg-[#292a2e]/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getHeroImageUrl(hero?.img || hero?.name)}
                          alt={hero?.localized_name || 'Hero'}
                          className="w-9 h-9 rounded object-cover border border-white/10 shrink-0"
                          onClick={() => {
                            if (hero) onSelectHero(hero.id);
                          }}
                        />
                        <div className="truncate">
                          {p.account_id ? (
                            <button
                              onClick={() => onSelectPlayer(p.account_id!)}
                              className="font-['Space_Grotesk'] font-bold text-white hover:text-[#ff525b] transition-colors truncate block text-left cursor-pointer"
                            >
                              {p.name || p.personaname || `Player ${idx + 1}`}
                            </button>
                          ) : (
                            <span className="font-['Space_Grotesk'] font-semibold text-white/80 truncate block">
                              {p.name || p.personaname || 'Anonymous'}
                            </span>
                          )}
                          <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb3b1]">
                            {hero?.localized_name || `Hero #${p.hero_id}`} · Lv {p.level}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] font-bold">
                      {p.kills} / <span className="text-[#ffb4ab]">{p.deaths}</span> / {p.assists}
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-[#ffc640] font-bold">
                      {p.net_worth ? `${(p.net_worth / 1000).toFixed(1)}k` : `${((p.gold_spent || 0) / 1000).toFixed(1)}k`}
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-[#e7bcbb]/80">
                      {p.last_hits} / {p.denies}
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-[#89ceff]">
                      {p.gold_per_min} / {p.xp_per_min}
                    </td>

                    <td className="py-2.5 px-3 font-['JetBrains_Mono'] text-[#ffb3b1] font-bold">
                      {p.hero_damage ? `${(p.hero_damage / 1000).toFixed(1)}k` : '-'}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1">
                        {items.map((itId, i) => (
                          <div
                            key={i}
                            className="w-7 h-5 rounded bg-[#0d0e12] overflow-hidden border border-white/5 flex items-center justify-center shrink-0"
                            title={getItemName(itId) || 'Item'}
                          >
                            {itId > 0 ? (
                              <img
                                src={getItemImageUrl(getItemName(itId))}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
