import React, { useState, useEffect } from 'react';
import { dotaService } from '../services/dotaService';
import { PageRoute, ProMatchItem } from '../types/index';
import { formatDuration, formatTimeAgo } from '../utils/dotaHelpers';
import { SkeletonCard, SkeletonTable } from '../components/common/SkeletonLoader';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface MatchesPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectMatch: (matchId: number) => void;
  onOpenStream: () => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({
  onNavigate: _onNavigate,
  onSelectMatch,
  onOpenStream,
}) => {
  const [proMatches, setProMatches] = useState<ProMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterWinner, setFilterWinner] = useState<'all' | 'radiant' | 'dire'>('all');
  const [matchIdInput, setMatchIdInput] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dotaService.getProMatches();
      setProMatches(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch pro circuit matches.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleInspectInputMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchIdInput.trim()) return;
    const clean = matchIdInput.trim().replace('#', '');
    if (!isNaN(Number(clean))) {
      onSelectMatch(Number(clean));
    }
  };

  const filteredMatches = proMatches.filter((m) => {
    if (filterWinner === 'radiant' && !m.radiant_win) return false;
    if (filterWinner === 'dire' && m.radiant_win) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.league_name} ${m.radiant_name} ${m.dire_name} ${m.match_id}`.toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#00e676]">
              Competitive Circuit Telemetry
            </span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-black text-white tracking-tight">
            PRO MATCHES & LIVE FEED
          </h1>
          <p className="text-sm text-[#8b8a91] mt-1 max-w-xl">
            Live tournament games, parsed pro replays, and real-time net worth leads across the Dota 2 professional circuit.
          </p>
        </div>

        {/* Live Stream & Search Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenStream}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#93000a] to-[#ff525b] hover:from-[#ba1a1a] hover:to-[#ff737b] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Live telemetry status</span>
          </button>

          {/* Quick Match ID input */}
          <form onSubmit={handleInspectInputMatch} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Match ID"
              value={matchIdInput}
              onChange={(e) => setMatchIdInput(e.target.value)}
              className="w-48 bg-[#1a1b20] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#e3e2e8] placeholder-[#77767d] focus:outline-none focus:border-[#ff525b]"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#25262c] hover:bg-[#32333a] border border-white/[0.08] rounded-xl text-xs font-mono font-bold text-white transition-colors cursor-pointer"
            >
              Parse
            </button>
          </form>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-[#15161a] p-3 rounded-xl border border-white/[0.06]">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'radiant', label: 'Radiant Victories' },
            { id: 'dire', label: 'Dire Victories' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterWinner(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                filterWinner === tab.id
                  ? 'bg-[#2b2c31] text-white shadow'
                  : 'text-[#8b8a91] hover:text-[#e3e2e8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter team, league..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 bg-[#1a1b20] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#e3e2e8] placeholder-[#77767d] focus:outline-none focus:border-[#ff525b]"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard className="h-28" />
          <SkeletonTable rows={8} />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchMatches} />
      ) : filteredMatches.length === 0 ? (
        <div className="p-12 text-center bg-[#15161a] rounded-2xl border border-white/[0.04]">
          <p className="text-base text-[#c6c6cd]">No pro matches found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((m) => {
            const isRadiantWin = m.radiant_win;
            return (
              <div
                key={m.match_id}
                onClick={() => onSelectMatch(m.match_id)}
                className="group p-4 bg-[#15161a] hover:bg-[#1a1b20] rounded-xl border border-white/[0.06] hover:border-[#ff525b]/40 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* League & Match Meta */}
                <div className="space-y-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#ffc640] uppercase font-bold">
                      {m.league_name || 'Tier 1 Pro Circuit'}
                    </span>
                    <span className="text-[10px] font-mono text-[#77767d]">
                      {formatTimeAgo(m.start_time)}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#8b8a91] flex items-center gap-2">
                    <span>ID #{m.match_id}</span>
                    <span>•</span>
                    <span>{formatDuration(m.duration)}</span>
                  </div>
                </div>

                {/* Scoreboard Clash */}
                <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8">
                  {/* Radiant */}
                  <div className="flex items-center gap-3 text-right flex-1 justify-end">
                    <div>
                      <span className={`text-sm sm:text-base font-bold tracking-tight block ${isRadiantWin ? 'text-white font-extrabold' : 'text-[#8b8a91]'}`}>
                        {m.radiant_name || 'Radiant'}
                      </span>
                      <span className="text-[10px] font-mono text-[#00e676] uppercase">Radiant</span>
                    </div>
                    <span className={`font-mono text-xl sm:text-2xl font-black ${isRadiantWin ? 'text-[#00e676]' : 'text-[#8b8a91]'}`}>
                      {m.radiant_score ?? 0}
                    </span>
                  </div>

                  {/* VS / Winner Tag */}
                  <div className="shrink-0 flex flex-col items-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#77767d]">VS</span>
                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full mt-1 ${
                        isRadiantWin
                          ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40'
                          : 'bg-[#ff525b]/20 text-[#ff525b] border border-[#ff525b]/40'
                      }`}
                    >
                      {isRadiantWin ? 'Radiant Win' : 'Dire Win'}
                    </span>
                  </div>

                  {/* Dire */}
                  <div className="flex items-center gap-3 text-left flex-1 justify-start">
                    <span className={`font-mono text-xl sm:text-2xl font-black ${!isRadiantWin ? 'text-[#ff525b]' : 'text-[#8b8a91]'}`}>
                      {m.dire_score ?? 0}
                    </span>
                    <div>
                      <span className={`text-sm sm:text-base font-bold tracking-tight block ${!isRadiantWin ? 'text-white font-extrabold' : 'text-[#8b8a91]'}`}>
                        {m.dire_name || 'Dire'}
                      </span>
                      <span className="text-[10px] font-mono text-[#ff525b] uppercase">Dire</span>
                    </div>
                  </div>
                </div>

                {/* Inspect Action */}
                <div className="shrink-0 flex items-center justify-end">
                  <span className="text-xs font-mono font-bold text-[#ff525b] group-hover:text-white group-hover:translate-x-1 transition-all flex items-center gap-1">
                    Telemetry Inspector &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
