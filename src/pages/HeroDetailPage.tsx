import React, { useState, useEffect } from 'react';
import { dotaService } from '../services/dotaService';
import { OpenDotaHero, PageRoute } from '../types/index';
import { getHeroImageUrl, getItemImageUrl } from '../utils/dotaHelpers';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface HeroDetailPageProps {
  heroId: number;
  onNavigate: (page: PageRoute) => void;
  onSelectHero: (heroId: number) => void;
}

export const HeroDetailPage: React.FC<HeroDetailPageProps> = ({
  heroId,
  onNavigate,
  onSelectHero,
}) => {
  const [hero, setHero] = useState<OpenDotaHero | null>(null);
  const [allHeroes, setAllHeroes] = useState<Map<number, OpenDotaHero>>(new Map());
  const [matchups, setMatchups] = useState<{ hero_id: number; games_played: number; wins: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'counters' | 'items' | 'talents'>('overview');

  const fetchHeroData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [heroStatsList, heroMatchups] = await Promise.all([
        dotaService.getHeroStats(),
        dotaService.getHeroMatchups(heroId).catch(() => []),
      ]);

      const map = new Map<number, OpenDotaHero>();
      heroStatsList.forEach((h) => map.set(h.id, h));
      setAllHeroes(map);

      const target = map.get(heroId) || heroStatsList.find((h) => h.id === heroId);
      if (target) {
        setHero(target);
      } else {
        setError(`Hero ID #${heroId} not found in Dota 2 database.`);
      }

      setMatchups(heroMatchups);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve hero statistics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroData();
  }, [heroId]);

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8 space-y-6">
        <SkeletonCard className="h-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !hero) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-12">
        <ErrorMessage message={error || 'Hero data is not available.'} onRetry={fetchHeroData} />
      </div>
    );
  }

  // Calculate bracket win rates
  const heraldPicks = (hero['1_pick'] || 0) + (hero['2_pick'] || 0);
  const heraldWins = (hero['1_win'] || 0) + (hero['2_win'] || 0);
  const heraldWr = heraldPicks > 0 ? (heraldWins / heraldPicks) * 100 : 50;

  const archonPicks = (hero['3_pick'] || 0) + (hero['4_pick'] || 0);
  const archonWins = (hero['3_win'] || 0) + (hero['4_win'] || 0);
  const archonWr = archonPicks > 0 ? (archonWins / archonPicks) * 100 : 50;

  const ancientPicks = (hero['5_pick'] || 0) + (hero['6_pick'] || 0);
  const ancientWins = (hero['5_win'] || 0) + (hero['6_win'] || 0);
  const ancientWr = ancientPicks > 0 ? (ancientWins / ancientPicks) * 100 : 50;

  const divinePicks = (hero['7_pick'] || 0) + (hero['8_pick'] || 0);
  const divineWins = (hero['7_win'] || 0) + (hero['8_win'] || 0);
  const divineWr = divinePicks > 0 ? (divineWins / divinePicks) * 100 : 50;

  const proPicks = hero.pro_pick || 0;
  const proWins = hero.pro_win || 0;
  const proWr = proPicks > 0 ? (proWins / proPicks) * 100 : 0;

  // Process worst and best matchups
  const enrichedMatchups = matchups
    .filter((m) => m.games_played >= 15 && allHeroes.has(m.hero_id))
    .map((m) => {
      const enemy = allHeroes.get(m.hero_id)!;
      const winRateAgainst = (m.wins / m.games_played) * 100;
      // Disadvantage = standard 50% - winRateAgainst
      const advantage = winRateAgainst - 50;
      return {
        enemy,
        games: m.games_played,
        wins: m.wins,
        winRate: winRateAgainst,
        advantage,
      };
    });

  const worstCounters = [...enrichedMatchups].sort((a, b) => a.winRate - b.winRate).slice(0, 8);
  const bestAgainst = [...enrichedMatchups].sort((a, b) => b.winRate - a.winRate).slice(0, 8);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#8b8a91] mb-6">
        <button
          onClick={() => onNavigate('heroes')}
          className="hover:text-white transition-colors cursor-pointer"
        >
          HEROES
        </button>
        <span>/</span>
        <span className="text-[#ff525b] uppercase font-bold">{hero.localized_name}</span>
      </div>

      {/* Hero Header HUD Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#15161a] via-[#1a1b20] to-[#121317] border border-white/[0.08] p-6 lg:p-8 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-15 pointer-events-none bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url(${getHeroImageUrl(hero.img || hero.name)})` }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Portrait */}
          <div className="relative w-36 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/[0.1] shrink-0 bg-black">
            <img
              src={getHeroImageUrl(hero.img || hero.name)}
              alt={hero.localized_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-[#0d0e12]/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold text-white border border-white/[0.08]">
              {hero.primary_attr === 'str' && <span className="text-[#ff525b]">STRENGTH</span>}
              {hero.primary_attr === 'agi' && <span className="text-[#00e676]">AGILITY</span>}
              {hero.primary_attr === 'int' && <span className="text-[#00b0ff]">INTELLIGENCE</span>}
              {hero.primary_attr === 'all' && <span className="text-[#d500f9]">UNIVERSAL</span>}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 bg-[#ff525b]/20 border border-[#ff525b]/40 text-[#ff525b] rounded text-xs font-mono font-bold uppercase tracking-wider">
                DATASET PATCH FIELD
              </span>
              <span className="px-2 py-0.5 bg-white/[0.06] text-[#c6c6cd] rounded text-xs font-mono">
                {hero.attack_type}
              </span>
              <span className="px-2 py-0.5 bg-white/[0.06] text-[#c6c6cd] rounded text-xs font-mono">
                ID #{hero.id}
              </span>
            </div>

            <h1 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-black text-white tracking-tight">
              {hero.localized_name}
            </h1>

            <p className="text-sm text-[#8b8a91]">
              Roles: <span className="text-[#e3e2e8] font-medium">{hero.roles.join(', ')}</span>
            </p>

            {/* Base Attributes Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-xl">
              <div className="bg-[#121317]/80 rounded-lg p-2.5 border border-white/[0.04]">
                <span className="text-[10px] text-[#77767d] font-mono uppercase block">Base Health</span>
                <span className="text-base font-mono font-bold text-[#00e676]">{hero.base_health}</span>
              </div>
              <div className="bg-[#121317]/80 rounded-lg p-2.5 border border-white/[0.04]">
                <span className="text-[10px] text-[#77767d] font-mono uppercase block">Base Mana</span>
                <span className="text-base font-mono font-bold text-[#00b0ff]">{hero.base_mana}</span>
              </div>
              <div className="bg-[#121317]/80 rounded-lg p-2.5 border border-white/[0.04]">
                <span className="text-[10px] text-[#77767d] font-mono uppercase block">Base Armor</span>
                <span className="text-base font-mono font-bold text-[#ffc640]">{hero.base_armor.toFixed(1)}</span>
              </div>
              <div className="bg-[#121317]/80 rounded-lg p-2.5 border border-white/[0.04]">
                <span className="text-[10px] text-[#77767d] font-mono uppercase block">Move Speed</span>
                <span className="text-base font-mono font-bold text-[#e3e2e8]">{hero.move_speed}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNavigate('ai-coach')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#93000a] to-[#ff525b] hover:from-[#ba1a1a] hover:to-[#ff737b] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>AI Tactical Drill</span>
            </button>
            <button
              onClick={() => onNavigate('builds')}
              className="px-4 py-2.5 rounded-xl bg-[#1f1f24] hover:bg-[#28292e] text-[#e3e2e8] font-bold text-xs uppercase tracking-wider border border-white/[0.08] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Timing Curves</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] mb-8">
        {[
          { id: 'overview', label: 'Bracket Win Rates' },
          { id: 'counters', label: 'Counters & Synergies' },
          { id: 'items', label: 'Item Build Progression' },
          { id: 'talents', label: 'Talents & Facets' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#ff525b] text-[#ff525b]'
                : 'border-transparent text-[#8b8a91] hover:text-[#e3e2e8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview (Bracket Win Rates) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Herald / Guardian */}
            <div className="bg-[#15161a] rounded-xl p-5 border border-white/[0.06]">
              <div className="text-xs font-mono uppercase text-[#77767d] mb-1">Herald / Guardian</div>
              <div className="text-2xl font-mono font-bold text-white mb-2">{heraldWr.toFixed(1)}%</div>
              <div className="w-full h-1.5 bg-[#25262c] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${heraldWr >= 50 ? 'bg-[#00e676]' : 'bg-[#ff525b]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (heraldWr - 35) * 3.3))}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-[#77767d]">{heraldPicks.toLocaleString()} matches</div>
            </div>

            {/* Archon / Crusader */}
            <div className="bg-[#15161a] rounded-xl p-5 border border-white/[0.06]">
              <div className="text-xs font-mono uppercase text-[#77767d] mb-1">Archon / Crusader</div>
              <div className="text-2xl font-mono font-bold text-white mb-2">{archonWr.toFixed(1)}%</div>
              <div className="w-full h-1.5 bg-[#25262c] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${archonWr >= 50 ? 'bg-[#00e676]' : 'bg-[#ff525b]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (archonWr - 35) * 3.3))}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-[#77767d]">{archonPicks.toLocaleString()} matches</div>
            </div>

            {/* Legend / Ancient */}
            <div className="bg-[#15161a] rounded-xl p-5 border border-white/[0.06]">
              <div className="text-xs font-mono uppercase text-[#77767d] mb-1">Legend / Ancient</div>
              <div className="text-2xl font-mono font-bold text-white mb-2">{ancientWr.toFixed(1)}%</div>
              <div className="w-full h-1.5 bg-[#25262c] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${ancientWr >= 50 ? 'bg-[#00e676]' : 'bg-[#ff525b]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (ancientWr - 35) * 3.3))}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-[#77767d]">{ancientPicks.toLocaleString()} matches</div>
            </div>

            {/* Divine / Immortal */}
            <div className="bg-[#15161a] rounded-xl p-5 border border-[#ff525b]/30 bg-gradient-to-b from-[#1a1b20] to-[#15161a]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono uppercase text-[#ff525b] font-bold">Divine / Immortal</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ff525b]/20 text-[#ff525b] font-mono">ELITE</span>
              </div>
              <div className="text-2xl font-mono font-bold text-[#00e676] mb-2">{divineWr.toFixed(1)}%</div>
              <div className="w-full h-1.5 bg-[#25262c] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${divineWr >= 50 ? 'bg-[#00e676]' : 'bg-[#ff525b]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (divineWr - 35) * 3.3))}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-[#77767d]">{divinePicks.toLocaleString()} matches</div>
            </div>

            {/* Pro Circuit */}
            <div className="bg-[#15161a] rounded-xl p-5 border border-white/[0.06]">
              <div className="text-xs font-mono uppercase text-[#ffc640] mb-1">Pro Esports</div>
              <div className="text-2xl font-mono font-bold text-white mb-2">{proWr > 0 ? `${proWr.toFixed(1)}%` : 'N/A'}</div>
              <div className="w-full h-1.5 bg-[#25262c] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#ffc640]"
                  style={{ width: `${Math.min(100, Math.max(0, (proWr - 35) * 3.3))}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-[#77767d]">
                {hero.pro_ban ? `${hero.pro_ban} bans` : `${proPicks} picks`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Counters & Synergies */}
      {activeTab === 'counters' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Worst Counters (Disadvantage) */}
          <div className="bg-[#15161a] rounded-xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff525b]" />
                  HARDEST COUNTERS
                </h3>
                <p className="text-xs text-[#8b8a91]">Heroes with the highest win rates against {hero.localized_name}</p>
              </div>
              <span className="text-xs font-mono text-[#ff525b] uppercase font-bold">Avoid / Ban</span>
            </div>

            <div className="space-y-2.5">
              {worstCounters.map(({ enemy, winRate, games }) => (
                <div
                  key={enemy.id}
                  onClick={() => onSelectHero(enemy.id)}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1a1b20] hover:bg-[#222329] border border-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getHeroImageUrl(enemy.img || enemy.name)}
                      alt={enemy.localized_name}
                      className="w-10 h-6 object-cover rounded shadow"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#e3e2e8] group-hover:text-white block">
                        {enemy.localized_name}
                      </span>
                      <span className="text-[10px] text-[#77767d] font-mono">{games} matches sample</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-[#ff525b]">
                      {winRate.toFixed(1)}% WR
                    </span>
                    <span className="block text-[10px] text-[#ff525b]/80 font-mono">
                      -{(50 - winRate).toFixed(1)}% Disadv.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Matchups (Advantage) */}
          <div className="bg-[#15161a] rounded-xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]" />
                  FAVORABLE MATCHUPS
                </h3>
                <p className="text-xs text-[#8b8a91]">Heroes that {hero.localized_name} reliably counters</p>
              </div>
              <span className="text-xs font-mono text-[#00e676] uppercase font-bold">Favorable Pick</span>
            </div>

            <div className="space-y-2.5">
              {bestAgainst.map(({ enemy, winRate, games }) => (
                <div
                  key={enemy.id}
                  onClick={() => onSelectHero(enemy.id)}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1a1b20] hover:bg-[#222329] border border-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getHeroImageUrl(enemy.img || enemy.name)}
                      alt={enemy.localized_name}
                      className="w-10 h-6 object-cover rounded shadow"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#e3e2e8] group-hover:text-white block">
                        {enemy.localized_name}
                      </span>
                      <span className="text-[10px] text-[#77767d] font-mono">{games} matches sample</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-[#00e676]">
                      {winRate.toFixed(1)}% WR
                    </span>
                    <span className="block text-[10px] text-[#00e676]/80 font-mono">
                      +{(winRate - 50).toFixed(1)}% Adv.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Items */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Early Game */}
            <div className="bg-[#15161a] rounded-xl border border-white/[0.06] p-6">
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded bg-amber-400" />
                Early Game (0-10m)
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'tango', label: 'Tango', cost: '90g', desc: 'Sustained lane HP regen' },
                  { name: 'branches', label: 'Iron Branch x2', cost: '100g', desc: 'Universal attribute padding' },
                  { name: 'circlet', label: 'Circlet', cost: '155g', desc: 'Early stat efficiency' },
                  { name: 'magic_wand', label: 'Magic Wand', cost: '450g', desc: 'Burst survival against spam' },
                  { name: 'boots', label: 'Boots of Speed', cost: '500g', desc: 'Positioning & rune contest' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1a1b20] border border-white/[0.04]">
                    <img src={getItemImageUrl(item.name)} alt={item.label} className="w-8 h-8 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e3e2e8] truncate">{item.label}</span>
                        <span className="text-[10px] font-mono text-[#ffc640]">{item.cost}</span>
                      </div>
                      <span className="text-[11px] text-[#77767d] block truncate">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Items */}
            <div className="bg-[#15161a] rounded-xl border border-[#ff525b]/20 p-6">
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded bg-[#ff525b]" />
                Core Items (12-25m)
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'travel_boots', label: 'Boots of Travel', cost: '2500g', desc: 'Map pressure & rapid TP' },
                  { name: 'blink', label: 'Blink Dagger', cost: '2250g', desc: 'Instant initiation / escape' },
                  { name: 'black_king_bar', label: 'Black King Bar', cost: '4050g', desc: 'Debuff immunity & fight stability' },
                  { name: 'ultimate_scepter', label: "Aghanim's Scepter", cost: '4200g', desc: 'Signature ability empowerment' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1a1b20] border border-white/[0.04]">
                    <img src={getItemImageUrl(item.name)} alt={item.label} className="w-8 h-8 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e3e2e8] truncate">{item.label}</span>
                        <span className="text-[10px] font-mono text-[#ffc640]">{item.cost}</span>
                      </div>
                      <span className="text-[11px] text-[#77767d] block truncate">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Late Game / Situational */}
            <div className="bg-[#15161a] rounded-xl border border-white/[0.06] p-6">
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded bg-purple-500" />
                Luxury & Situational
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'refresher', label: 'Refresher Orb', cost: '5000g', desc: 'Double spell rotation' },
                  { name: 'sheepstick', label: 'Scythe of Vyse', cost: '5675g', desc: 'Instant hex disable' },
                  { name: 'octarine_core', label: 'Octarine Core', cost: '5275g', desc: '25% cooldown reduction' },
                  { name: 'aeon_disk', label: 'Aeon Disk', cost: '3000g', desc: 'Anti-burst dispelling trigger' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1a1b20] border border-white/[0.04]">
                    <img src={getItemImageUrl(item.name)} alt={item.label} className="w-8 h-8 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e3e2e8] truncate">{item.label}</span>
                        <span className="text-[10px] font-mono text-[#ffc640]">{item.cost}</span>
                      </div>
                      <span className="text-[11px] text-[#77767d] block truncate">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Talents */}
      {activeTab === 'talents' && (
        <div className="bg-[#15161a] rounded-xl border border-white/[0.06] p-8 max-w-2xl mx-auto">
          <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white mb-6 text-center">
            TALENT TREE SPECIFICATION
          </h3>
          <div className="space-y-4">
            {[
              { level: 25, left: 'Radial Deafening Blast / +2.5s Duration', right: 'Cataclysm 2x Orbs / +300 Damage' },
              { level: 20, left: '+40 Chaos Meteor Damage', right: '-10s Tornado Cooldown' },
              { level: 15, left: '+2 Forged Spirits Summoned', right: '+40 Cold Snap Damage' },
              { level: 10, left: '+250 Health', right: '+1.5s Cold Snap Duration' },
            ].map((t) => (
              <div key={t.level} className="flex items-center gap-4">
                <div className="flex-1 bg-[#1a1b20] p-3 rounded-lg text-right text-xs font-medium text-[#c6c6cd] border border-white/[0.04]">
                  {t.left}
                </div>
                <div className="w-10 h-10 rounded-full bg-[#ff525b]/20 border border-[#ff525b]/40 text-[#ff525b] font-mono font-bold flex items-center justify-center shrink-0 text-sm">
                  {t.level}
                </div>
                <div className="flex-1 bg-[#1a1b20] p-3 rounded-lg text-left text-xs font-medium text-[#c6c6cd] border border-white/[0.04]">
                  {t.right}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
