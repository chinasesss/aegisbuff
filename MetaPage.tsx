import React, { useState, useEffect } from 'react';
import { dotaService } from '../services/dotaService';
import { OpenDotaHero, PageRoute } from '../types/index';
import { getHeroImageUrl } from '../utils/dotaHelpers';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface MetaPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectHero: (heroId: number) => void;
}

export const MetaPage: React.FC<MetaPageProps> = ({ onNavigate: _onNavigate, onSelectHero }) => {
  const [heroes, setHeroes] = useState<OpenDotaHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Carry' | 'Mid' | 'Offlane' | 'Support'>('All');

  const fetchMeta = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dotaService.getHeroStats();
      setHeroes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch meta statistics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  // Compute calculated metrics
  const enriched = heroes.map((h) => {
    const picks = (h['1_pick'] || 0) + (h['2_pick'] || 0) + (h['3_pick'] || 0) + (h['4_pick'] || 0) + (h['5_pick'] || 0) + (h['6_pick'] || 0) + (h['7_pick'] || 0) + (h['8_pick'] || 0);
    const wins = (h['1_win'] || 0) + (h['2_win'] || 0) + (h['3_win'] || 0) + (h['4_win'] || 0) + (h['5_win'] || 0) + (h['6_win'] || 0) + (h['7_win'] || 0) + (h['8_win'] || 0);
    const winRate = picks > 0 ? (wins / picks) * 100 : 50;

    // High rank win rate (Divine + Immortal)
    const highPicks = (h['7_pick'] || 0) + (h['8_pick'] || 0);
    const highWins = (h['7_win'] || 0) + (h['8_win'] || 0);
    const highWr = highPicks > 0 ? (highWins / highPicks) * 100 : winRate;

    return {
      ...h,
      totalPicks: picks,
      winRate,
      highWr,
    };
  });

  const filtered = enriched.filter((h) => {
    if (roleFilter === 'Carry' && !h.roles.includes('Carry')) return false;
    if (roleFilter === 'Support' && !h.roles.includes('Support')) return false;
    if (roleFilter === 'Offlane' && (!h.roles.includes('Initiator') && !h.roles.includes('Durable'))) return false;
    if (roleFilter === 'Mid' && (!h.roles.includes('Nuker') && !h.roles.includes('Carry'))) return false;
    return true;
  });

  const godTier = filtered.filter((h) => h.highWr >= 53.5).sort((a, b) => b.highWr - a.highWr);
  const sTier = filtered.filter((h) => h.highWr >= 52.0 && h.highWr < 53.5).sort((a, b) => b.highWr - a.highWr);
  const aTier = filtered.filter((h) => h.highWr >= 50.5 && h.highWr < 52.0).sort((a, b) => b.highWr - a.highWr);
  const bTier = filtered.filter((h) => h.highWr < 50.5).sort((a, b) => b.highWr - a.highWr);

  const topContested = [...enriched].sort((a, b) => (b.pro_ban || 0) + (b.pro_pick || 0) - ((a.pro_ban || 0) + (a.pro_pick || 0))).slice(0, 5);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ff525b] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ff525b]">
              OpenDota Meta Matrix
            </span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-black text-white tracking-tight">
            META TIER LIST & DYNAMICS
          </h1>
          <p className="text-sm text-[#8b8a91] mt-1 max-w-xl">
            Algorithmic tiers computed from Divine/Immortal win rates, competitive pick density, and pro draft frequency.
          </p>
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 bg-[#15161a] p-1 rounded-xl border border-white/[0.06]">
          {(['All', 'Carry', 'Mid', 'Offlane', 'Support'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-[#2b2c31] text-white shadow'
                  : 'text-[#8b8a91] hover:text-[#e3e2e8]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top Contested Spotlight */}
      <div className="bg-[#15161a] rounded-2xl border border-white/[0.06] p-6 mb-8 shadow-xl">
        <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ffc640]" />
          MOST CONTESTED PRO HEROES (PICKS + BANS)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {topContested.map((hero) => {
            const contested = (hero.pro_ban || 0) + (hero.pro_pick || 0);
            return (
              <div
                key={hero.id}
                onClick={() => onSelectHero(hero.id)}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1b20] hover:bg-[#222329] border border-white/[0.04] cursor-pointer transition-all group"
              >
                <img
                  src={getHeroImageUrl(hero.img || hero.name)}
                  alt={hero.localized_name}
                  className="w-12 h-7 rounded object-cover shadow"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#e3e2e8] group-hover:text-white truncate block">
                    {hero.localized_name}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-[#8b8a91] font-mono mt-0.5">
                    <span>{contested} contested</span>
                    <span className="text-[#00e676]">{hero.highWr.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Sections */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-40" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchMeta} />
      ) : (
        <div className="space-y-8">
          {/* God Tier */}
          <div className="bg-[#15161a] rounded-2xl border border-[#ff525b]/30 p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#ff525b] text-white text-xs font-mono font-black rounded-md uppercase">
                  GOD TIER (S+)
                </span>
                <span className="text-xs text-[#8b8a91]">High Bracket WR &gt; 53.5%</span>
              </div>
              <span className="text-xs font-mono text-[#ff525b] font-bold">{godTier.length} heroes</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {godTier.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onSelectHero(h.id)}
                  className="p-3 bg-[#1a1b20] hover:bg-[#25262c] rounded-xl border border-white/[0.04] hover:border-[#ff525b] transition-all cursor-pointer group"
                >
                  <img
                    src={getHeroImageUrl(h.img || h.name)}
                    alt={h.localized_name}
                    className="w-full aspect-[16/9] object-cover rounded-lg mb-2 shadow"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e3e2e8] group-hover:text-white truncate">
                      {h.localized_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00e676]">
                      {h.highWr.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* S Tier */}
          <div className="bg-[#15161a] rounded-2xl border border-white/[0.06] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-amber-500 text-black text-xs font-mono font-black rounded-md uppercase">
                  TIER S
                </span>
                <span className="text-xs text-[#8b8a91]">High Bracket WR 52.0% - 53.4%</span>
              </div>
              <span className="text-xs font-mono text-[#ffc640] font-bold">{sTier.length} heroes</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sTier.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onSelectHero(h.id)}
                  className="p-3 bg-[#1a1b20] hover:bg-[#25262c] rounded-xl border border-white/[0.04] hover:border-amber-400 transition-all cursor-pointer group"
                >
                  <img
                    src={getHeroImageUrl(h.img || h.name)}
                    alt={h.localized_name}
                    className="w-full aspect-[16/9] object-cover rounded-lg mb-2 shadow"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e3e2e8] group-hover:text-white truncate">
                      {h.localized_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00e676]">
                      {h.highWr.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* A Tier */}
          <div className="bg-[#15161a] rounded-2xl border border-white/[0.06] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-sky-500 text-black text-xs font-mono font-black rounded-md uppercase">
                  TIER A
                </span>
                <span className="text-xs text-[#8b8a91]">High Bracket WR 50.5% - 51.9%</span>
              </div>
              <span className="text-xs font-mono text-sky-400 font-bold">{aTier.length} heroes</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {aTier.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onSelectHero(h.id)}
                  className="p-3 bg-[#1a1b20] hover:bg-[#25262c] rounded-xl border border-white/[0.04] hover:border-sky-400 transition-all cursor-pointer group"
                >
                  <img
                    src={getHeroImageUrl(h.img || h.name)}
                    alt={h.localized_name}
                    className="w-full aspect-[16/9] object-cover rounded-lg mb-2 shadow"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e3e2e8] group-hover:text-white truncate">
                      {h.localized_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00e676]">
                      {h.highWr.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B Tier */}
          <div className="bg-[#15161a] rounded-2xl border border-white/[0.06] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#25262c] text-[#8b8a91] text-xs font-mono font-black rounded-md uppercase">
                  TIER B / NICHE
                </span>
                <span className="text-xs text-[#8b8a91]">High Bracket WR &lt; 50.5%</span>
              </div>
              <span className="text-xs font-mono text-[#8b8a91] font-bold">{bTier.length} heroes</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {bTier.slice(0, 18).map((h) => (
                <div
                  key={h.id}
                  onClick={() => onSelectHero(h.id)}
                  className="p-3 bg-[#1a1b20] hover:bg-[#25262c] rounded-xl border border-white/[0.04] transition-all cursor-pointer group"
                >
                  <img
                    src={getHeroImageUrl(h.img || h.name)}
                    alt={h.localized_name}
                    className="w-full aspect-[16/9] object-cover rounded-lg mb-2 shadow"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8b8a91] group-hover:text-white truncate">
                      {h.localized_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#ff525b]">
                      {h.highWr.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
