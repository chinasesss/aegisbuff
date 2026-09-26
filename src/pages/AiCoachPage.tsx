import React, { useState, useEffect } from 'react';
import { dotaService } from '../services/dotaService';
import { generateCoachAnalysis, AiCoachAnalysisResult } from '../services/aiCoachService';
import { PageRoute, PlayerHeroStat, PlayerMatchSummary, PlayerProfileData } from '../types';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface AiCoachPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectHero: (heroId: number) => void;
  onOpenReplay: (incident: {
    matchId: string;
    timestamp: string;
    title: string;
    description: string;
    imageUrl: string;
  }) => void;
}

export const AiCoachPage: React.FC<AiCoachPageProps> = ({
  onNavigate: _onNavigate,
  onSelectHero: _onSelectHero,
  onOpenReplay,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState<string>('');
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [matches, setMatches] = useState<PlayerMatchSummary[]>([]);
  const [heroes, setHeroes] = useState<PlayerHeroStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeQuery, setActiveQuery] = useState<string>('Analyze my last 20 games');
  const [analysis, setAnalysis] = useState<AiCoachAnalysisResult | null>(null);

  const quickPrompts = [
    'Analyze my last 20 games',
    'Why am I losing so many games on Pudge?',
    'How can I improve my farm efficiency and GPM?',
    'What items should I prioritize against heavy magic burst?',
    'What are my worst lane habits and death triggers?',
  ];

  const fetchPlayerTelemetry = async (accountId: number) => {
    setLoading(true);
    setError(null);
    try {
      const [playerData, matchesData, heroesData] = await Promise.all([
        dotaService.getPlayer(accountId),
        dotaService.getPlayerMatches(accountId, { limit: 25 }),
        dotaService.getPlayerHeroes(accountId),
      ]);
      setProfile(playerData);
      setMatches(matchesData);
      setHeroes(heroesData);

      // Trigger analysis
      const res = await generateCoachAnalysis(activeQuery, playerData, matchesData, heroesData);
      setAnalysis(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Telemetry sync failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (selectedAccountId !== null) fetchPlayerTelemetry(selectedAccountId); }, [selectedAccountId]);

  const handleQuerySelect = (query: string) => {
    setActiveQuery(query);
    if (profile) {
      const res = await generateCoachAnalysis(query, profile, matches, heroes);
      setAnalysis(res);
    }
  };

  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const num = Number(customInput.trim());
    if (!isNaN(num) && num > 0) {
      setSelectedAccountId(num);
      setCustomInput('');
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff525b] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ff525b]">
              Aegis Neural Coaching Core
            </span>
          </div>
          <h1 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-black text-white tracking-tight">
            AI TACTICAL MENTOR
          </h1>
          <p className="text-sm text-[#8b8a91] mt-1 max-w-xl">
            Real telemetry analysis diagnosing farming efficiency, positioning bottlenecks, item spikes, and tactical lane adjustments.
          </p>
        </div>

        <form onSubmit={handleCustomAccountSubmit} className="flex items-center gap-1">
          <input type="text" placeholder="OpenDota Account ID..." value={customInput} onChange={e => setCustomInput(e.target.value)} className="w-44 bg-[#1a1b20] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#77767d] focus:outline-none focus:border-[#ff525b]" />
          <button type="submit" className="px-3 py-1.5 bg-[#ff525b] rounded-lg text-xs font-bold text-white">Analyze</button>
        </form>
      </div>

      {/* Target Player Telemetry HUD */}
      {profile && (
        <div className="bg-[#15161a] rounded-2xl border border-white/[0.06] p-4 lg:p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profile.profile.avatarfull}
              alt={profile.profile.personaname}
              className="w-14 h-14 rounded-xl object-cover border border-white/[0.1] shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] text-lg font-black text-white">
                  {profile.profile.personaname}
                </span>
                <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono uppercase font-bold">
                  Telemetry Active
                </span>
              </div>
              <span className="text-xs text-[#77767d] font-mono">
                Steam ID #{profile.profile.account_id} • {matches.length} Matches Sampled
              </span>
            </div>
          </div>

          {analysis && (
            <div className="bg-[#121317] px-4 py-2.5 rounded-xl border border-white/[0.04] text-right">
              <span className="text-[10px] text-[#77767d] font-mono uppercase block">{analysis.keyMetric.label}</span>
              <span className="text-base font-mono font-bold text-[#00e676]">{analysis.keyMetric.value}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Prompts Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleQuerySelect(prompt)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeQuery === prompt
                ? 'bg-[#ff525b] text-white shadow-lg shadow-[#ff525b]/20 scale-102'
                : 'bg-[#15161a] hover:bg-[#1f2027] text-[#8b8a91] hover:text-[#e3e2e8] border border-white/[0.04]'
            }`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Main Analysis Results Console */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-48" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={selectedAccountId !== null ? () => fetchPlayerTelemetry(selectedAccountId) : undefined} />
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Diagnostic Core Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#15161a] rounded-2xl border border-white/[0.08] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
                <div>
                  <h3 className="font-['Space_Grotesk'] text-xl font-black text-white">
                    Neural Diagnostic Output
                  </h3>
                  <p className="text-xs text-[#8b8a91] mt-0.5">Query: &quot;{analysis.question}&quot;</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/30 text-xs font-mono font-bold">
                  OPEN DOTA DATA
                </span>
              </div>

              {/* Factual Telemetry Data */}
              <div className="mb-6">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#ffc640] mb-3 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ffc640]" />
                  Verified Telemetry Metrics
                </h4>
                <div className="space-y-2 bg-[#121317] p-4 rounded-xl border border-white/[0.04]">
                  {analysis.factualData.map((fact, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#c6c6cd]">
                      <span className="text-[#ff525b] font-mono font-bold">&gt;</span>
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Strategic Assessment */}
              <div className="mb-6">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#00e676] mb-3 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00e676]" />
                  Aegis Tactical Breakdown
                </h4>
                <div className="space-y-2 bg-[#121317] p-4 rounded-xl border border-white/[0.04]">
                  {analysis.aiAnalysis.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#e3e2e8]">
                      <span className="text-[#00e676] font-mono font-bold">●</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Drills & Advice */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#ff525b] mb-3 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff525b]" />
                  Prescribed Behavioral Drills
                </h4>
                <div className="space-y-2">
                  {analysis.actionableAdvice.map((advice, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gradient-to-r from-[#1c1d24] to-[#17181e] rounded-xl border border-white/[0.06] text-xs font-medium text-white flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#ff525b]/20 text-[#ff525b] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <span>{advice}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6"><div className="bg-[#15161a] rounded-2xl border border-white/[0.08] p-6 shadow-xl"><h3 className="font-['Space_Grotesk'] text-base font-bold text-white uppercase tracking-wider mb-2">Replay telemetry</h3><p className="text-xs text-[#8b8a91]">No replay incidents are displayed because this build does not have a verified replay-event source.</p></div>

            <div className="bg-[#15161a] rounded-2xl border border-white/[0.08] p-6 shadow-xl"><h3 className="font-['Space_Grotesk'] text-base font-bold text-white uppercase tracking-wider mb-2">Benchmark status</h3><p className="text-xs text-[#8b8a91]">Cross-player benchmark values are not shown until a defined comparison population and current dataset are available.</p></div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
