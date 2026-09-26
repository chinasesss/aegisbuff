import React, { useState, useEffect } from 'react';
import { dotaService } from '../services/dotaService';
import { OpenDotaHero, PageRoute } from '../types/index';
import { getHeroImageUrl } from '../utils/dotaHelpers';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface HeroesPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectHero: (heroId: number) => void;
}

export const HeroesPage: React.FC<HeroesPageProps> = ({ onNavigate: _onNavigate, onSelectHero }) => {
  const [heroes, setHeroes] = useState<OpenDotaHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [attrFilter, setAttrFilter] = useState<'all' | 'str' | 'agi' | 'int' | 'universal'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'winRate' | 'pickRate' | 'proWin' | 'name'>('winRate');

  const fetchHeroes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dotaService.getHeroStats();
      setHeroes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load hero statistics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroes();
  }, []);

  const rolesList = ['All', 'Carry', 'Support', 'Nuker', 'Disabler', 'Initiator', 'Durable', 'Escape', 'Pusher'];

  const filteredHeroes = heroes
    .filter((hero) => {
      // Attribute filter
      if (attrFilter === 'str' && hero.primary_attr !== 'str') return false;
      if (attrFilter === 'agi' && hero.primary_attr !== 'agi') return false;
      if (attrFilter === 'int' && hero.primary_attr !== 'int') return false;
      if (attrFilter === 'universal' && hero.primary_attr !== 'all') return false;

      // Role filter
      if (roleFilter !== 'All' && !hero.roles.includes(roleFilter)) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return hero.localized_name.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const aPicks = (a['1_pick'] || 0) + (a['2_pick'] || 0) + (a['3_pick'] || 0) + (a['4_pick'] || 0) + (a['5_pick'] || 0) + (a['6_pick'] || 0) + (a['7_pick'] || 0) + (a['8_pick'] || 0);
      const bPicks = (b['1_pick'] || 0) + (b['2_pick'] || 0) + (b['3_pick'] || 0) + (b['4_pick'] || 0) + (b['5_pick'] || 0) + (b['6_pick'] || 0) + (b['7_pick'] || 0) + (b['8_pick'] || 0);

      const aWins = (a['1_win'] || 0) + (a['2_win'] || 0) + (a['3_win'] || 0) + (a['4_win'] || 0) + (a['5_win'] || 0) + (a['6_win'] || 0) + (a['7_win'] || 0) + (a['8_win'] || 0);
      const bWins = (b['1_win'] || 0) + (b['2_win'] || 0) + (b['3_win'] || 0) + (b['4_win'] || 0) + (b['5_win'] || 0) + (b['6_win'] || 0) + (b['7_win'] || 0) + (b['8_win'] || 0);

      const aWr = aPicks > 0 ? (aWins / aPicks) * 100 : 50;
      const bWr = bPicks > 0 ? (bWins / bPicks) * 100 : 50;

      if (sortBy === 'winRate') return bWr - aWr;
      if (sortBy === 'pickRate') return bPicks - aPicks;
      if (sortBy === 'proWin') {
        const aProWr = (a.pro_pick && a.pro_pick > 0) ? ((a.pro_win || 0) / a.pro_pick) * 100 : 0;
        const bProWr = (b.pro_pick && b.pro_pick > 0) ? ((b.pro_win || 0) / b.pro_pick) * 100 : 0;
        return bProWr - aProWr;
      }
      return a.localized_name.localeCompare(b.localized_name);
    });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ff525b] animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ff525b]">OpenDota Meta Telemetry</span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-extrabold text-[#e3e2e8] tracking-tight">
            HEROES <span className="text-white/40 text-2xl font-normal">({filteredHeroes.length} tracked)</span>
          </h1>
          <p className="text-sm text-[#c6c6cd] mt-1 max-w-xl">
            Live win rates, pick velocities, and performance statistics across all brackets derived from legitimate competitive matches.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search hero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-[#1a1b20] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#e3e2e8] placeholder-[#77767d] focus:outline-none focus:border-[#ff525b]"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#1a1b20] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#e3e2e8] focus:outline-none focus:border-[#ff525b] cursor-pointer"
          >
            <option value="winRate">Sort: Win Rate</option>
            <option value="pickRate">Sort: Pick Rate</option>
            <option value="proWin">Sort: Pro Win Rate</option>
            <option value="name">Sort: Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Attribute Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 bg-[#1a1b20] p-1 rounded-xl border border-white/[0.06]">
          {[
            { id: 'all', label: 'All Attributes' },
            { id: 'str', label: 'Strength', color: '#ff525b' },
            { id: 'agi', label: 'Agility', color: '#00e676' },
            { id: 'int', label: 'Intelligence', color: '#00b0ff' },
            { id: 'universal', label: 'Universal', color: '#d500f9' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAttrFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                attrFilter === tab.id
                  ? 'bg-[#2b2c31] text-white shadow-md'
                  : 'text-[#8b8a91] hover:text-[#e3e2e8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Roles Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {rolesList.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer ${
                roleFilter === r
                  ? 'bg-[#ff525b]/20 text-[#ff525b] border border-[#ff525b]/40'
                  : 'bg-[#15161a] text-[#8b8a91] hover:text-[#e3e2e8] border border-white/[0.04]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <SkeletonCard key={i} className="h-56" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchHeroes} />
      ) : filteredHeroes.length === 0 ? (
        <div className="p-12 text-center bg-[#15161a] rounded-2xl border border-white/[0.04]">
          <p className="text-base text-[#c6c6cd]">No heroes found matching your search and filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredHeroes.map((hero) => {
            const picks = (hero['1_pick'] || 0) + (hero['2_pick'] || 0) + (hero['3_pick'] || 0) + (hero['4_pick'] || 0) + (hero['5_pick'] || 0) + (hero['6_pick'] || 0) + (hero['7_pick'] || 0) + (hero['8_pick'] || 0);
            const wins = (hero['1_win'] || 0) + (hero['2_win'] || 0) + (hero['3_win'] || 0) + (hero['4_win'] || 0) + (hero['5_win'] || 0) + (hero['6_win'] || 0) + (hero['7_win'] || 0) + (hero['8_win'] || 0);
            const winRate = picks > 0 ? (wins / picks) * 100 : 50;
            const proWr = hero.pro_pick && hero.pro_pick > 0 ? ((hero.pro_win || 0) / hero.pro_pick) * 100 : 0;

            const isHighWr = winRate >= 52;
            const isLowWr = winRate <= 48;

            return (
              <div
                key={hero.id}
                onClick={() => onSelectHero(hero.id)}
                className="group relative bg-[#15161a] hover:bg-[#1a1b20] rounded-xl border border-white/[0.06] hover:border-[#ff525b]/50 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)] flex flex-col"
              >
                {/* Hero Thumbnail */}
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-black/60">
                  <img
                    src={getHeroImageUrl(hero.img || hero.name)}
                    alt={hero.localized_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Attribute Badge */}
                  <div className="absolute top-2 left-2 bg-[#0d0e12]/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold text-white border border-white/[0.08]">
                    {hero.primary_attr === 'str' && <span className="text-[#ff525b]">STR</span>}
                    {hero.primary_attr === 'agi' && <span className="text-[#00e676]">AGI</span>}
                    {hero.primary_attr === 'int' && <span className="text-[#00b0ff]">INT</span>}
                    {hero.primary_attr === 'all' && <span className="text-[#d500f9]">UNI</span>}
                  </div>

                  {/* Attack Type */}
                  <div className="absolute top-2 right-2 bg-[#0d0e12]/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-[#c6c6cd]">
                    {hero.attack_type}
                  </div>
                </div>

                {/* Hero Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#e3e2e8] group-hover:text-white truncate">
                      {hero.localized_name}
                    </h3>
                    <p className="text-[11px] text-[#77767d] truncate mt-0.5">
                      {hero.roles.slice(0, 2).join(' • ')}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/[0.04] space-y-1.5">
                    {/* Win Rate */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8b8a91] text-[10px] uppercase font-mono">Win Rate</span>
                      <span
                        className={`font-mono font-bold ${
                          isHighWr ? 'text-[#00e676]' : isLowWr ? 'text-[#ff525b]' : 'text-[#ffc640]'
                        }`}
                      >
                        {winRate.toFixed(1)}%
                      </span>
                    </div>

                    {/* Win rate progress bar */}
                    <div className="w-full h-1 bg-[#25262c] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isHighWr ? 'bg-[#00e676]' : isLowWr ? 'bg-[#ff525b]' : 'bg-[#ffc640]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (winRate - 40) * 5))}%` }}
                      />
                    </div>

                    {/* Pro Win or Picks */}
                    <div className="flex items-center justify-between text-[10px] text-[#77767d] font-mono">
                      <span>Pro WR: {proWr > 0 ? `${proWr.toFixed(1)}%` : 'N/A'}</span>
                      <span>{picks.toLocaleString()} matches</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
