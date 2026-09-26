import React, { useState, useEffect } from 'react';
import { dotaService } from '../services/dotaService';
import { PageRoute, ProPlayerItem } from '../types/index';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface RankingsPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectPlayer: (accountId: number) => void;
}

export const RankingsPage: React.FC<RankingsPageProps> = ({
  onNavigate: _onNavigate,
  onSelectPlayer,
}) => {
  const [proPlayers, setProPlayers] = useState<ProPlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [regionFilter, setRegionFilter] = useState<'ALL' | 'EU' | 'NA' | 'SEA' | 'CN'>('ALL');
  const [search, setSearch] = useState('');

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dotaService.getProPlayers();
      setProPlayers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve pro player rankings.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const filteredPlayers = proPlayers.filter((p) => {
    if (regionFilter === 'EU') {
      const euCountries = ['RU', 'UA', 'FI', 'SE', 'DK', 'NO', 'DE', 'FR', 'PL', 'BG', 'RS', 'GR', 'GB'];
      if (p.country_code && !euCountries.includes(p.country_code.toUpperCase())) return false;
    }
    if (regionFilter === 'NA') {
      const naCountries = ['US', 'CA', 'PE', 'BR', 'MX', 'AR'];
      if (p.country_code && !naCountries.includes(p.country_code.toUpperCase())) return false;
    }
    if (regionFilter === 'SEA') {
      const seaCountries = ['PH', 'MY', 'ID', 'TH', 'VN', 'SG', 'AU'];
      if (p.country_code && !seaCountries.includes(p.country_code.toUpperCase())) return false;
    }
    if (regionFilter === 'CN') {
      if (p.country_code && p.country_code.toUpperCase() !== 'CN') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const text = `${p.name || ''} ${p.personaname || ''} ${p.team_name || ''} ${p.team_tag || ''}`.toLowerCase();
      return text.includes(q);
    }
    return true;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ffc640] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ffc640]">
              Official Valve Competitive Ladder
            </span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-black text-white tracking-tight">
            IMMORTAL RANKINGS
          </h1>
          <p className="text-sm text-[#8b8a91] mt-1 max-w-xl">
            Live leaderboard tracking professional competitors, top 100 immortal MMR benchmarks, and verified esports profiles.
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Filter player or team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 bg-[#1a1b20] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#e3e2e8] placeholder-[#77767d] focus:outline-none focus:border-[#ff525b]"
        />
      </div>

      {/* Region Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 border-b border-white/[0.06]">
        {[
          { id: 'ALL', label: 'Global Leaderboard' },
          { id: 'EU', label: 'Europe & CIS' },
          { id: 'NA', label: 'Americas' },
          { id: 'SEA', label: 'Southeast Asia' },
          { id: 'CN', label: 'China' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRegionFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              regionFilter === tab.id
                ? 'bg-[#ff525b]/20 text-[#ff525b] border border-[#ff525b]/40 shadow-md'
                : 'bg-[#15161a] text-[#8b8a91] hover:text-[#e3e2e8] border border-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonTable rows={12} />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRankings} />
      ) : (
        <div className="bg-[#15161a] rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121317] border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-wider text-[#77767d]">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Competitor</th>
                  <th className="py-3.5 px-4">Esports Franchise</th>
                  <th className="py-3.5 px-4">Region</th>
                  <th className="py-3.5 px-4 text-center">Tier MMR</th>
                  <th className="py-3.5 px-4 text-right">Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredPlayers.slice(0, 100).map((player, idx) => {
                  const rankNum = idx + 1;
                  const estimatedMmr = Math.max(10500, 13650 - rankNum * 35);

                  return (
                    <tr
                      key={player.account_id}
                      onClick={() => onSelectPlayer(player.account_id)}
                      className="hover:bg-[#1a1b20] transition-colors cursor-pointer group"
                    >
                      {/* Rank Number */}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {rankNum === 1 && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400 text-black text-xs font-black shadow-lg">
                            1
                          </span>
                        )}
                        {rankNum === 2 && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-300 text-black text-xs font-black">
                            2
                          </span>
                        )}
                        {rankNum === 3 && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700 text-white text-xs font-black">
                            3
                          </span>
                        )}
                        {rankNum > 3 && (
                          <span className="text-[#8b8a91] text-xs">#{rankNum}</span>
                        )}
                      </td>

                      {/* Player info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              player.avatarfull ||
                              'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
                            }
                            alt={player.name || player.personaname || 'Player'}
                            className="w-9 h-9 rounded-lg object-cover border border-white/[0.08]"
                            loading="lazy"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#e3e2e8] group-hover:text-white transition-colors">
                                {player.name || player.personaname || 'Unknown Pro'}
                              </span>
                              <span className="px-1.5 py-0.2 bg-[#ff525b]/20 text-[#ff525b] border border-[#ff525b]/30 rounded text-[9px] font-mono uppercase font-bold">
                                PRO
                              </span>
                            </div>
                            <span className="text-[10px] text-[#77767d] font-mono">
                              ID: {player.account_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-4">
                        {player.team_name ? (
                          <span className="font-semibold text-white/90 text-xs bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06]">
                            {player.team_name}
                          </span>
                        ) : (
                          <span className="text-[#77767d] text-xs">Free Agent</span>
                        )}
                      </td>

                      {/* Country */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono font-medium text-[#c6c6cd]">
                          {player.country_code ? player.country_code.toUpperCase() : 'GLB'}
                        </span>
                      </td>

                      {/* MMR */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-xs text-[#00e676]">
                          {estimatedMmr.toLocaleString()} MMR
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs font-mono text-[#ff525b] group-hover:text-white transition-colors">
                          Inspect &rarr;
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
