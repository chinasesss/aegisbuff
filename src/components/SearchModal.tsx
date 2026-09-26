import React, { useEffect, useState } from 'react';
import { dotaService } from '../services/dotaService';
import { OpenDotaHero, SearchPlayerItem } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHero: (heroId: number) => void;
  onSelectPlayer: (accountId: number) => void;
  onSelectMatch: (matchId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectHero, onSelectPlayer, onSelectMatch }) => {
  const [query, setQuery] = useState('');
  const [heroes, setHeroes] = useState<OpenDotaHero[]>([]);
  const [players, setPlayers] = useState<SearchPlayerItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    dotaService.getHeroStats().then(setHeroes).catch(() => setHeroes([]));
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || /^\d{10,}$/.test(query.trim())) { setPlayers([]); return; }
    const timer = window.setTimeout(() => {
      setLoading(true);
      dotaService.searchPlayers(query).then(setPlayers).catch(() => setPlayers([])).finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  if (!isOpen) return null;
  const q = query.toLowerCase().trim();
  const filteredHeroes = q ? heroes.filter(h => h.localized_name.toLowerCase().includes(q) || h.name.toLowerCase().includes(q)).slice(0, 8) : heroes.slice(0, 8);
  const numeric = /^\d{10,}$/.test(q);

  return <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md" onMouseDown={onClose}>
    <div className="w-full max-w-2xl bg-[#1a1b20] border border-white/10 rounded-xl shadow-2xl overflow-hidden" onMouseDown={e => e.stopPropagation()}>
      <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-[#121317]">
        <span className="material-symbols-outlined text-[22px] text-[#ff525b] mr-3">search</span>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a hero, player or match ID..." className="w-full bg-transparent text-white placeholder:text-white/30 text-[15px] focus:outline-none" />
        <kbd className="px-2 py-0.5 bg-[#292a2e] text-white/50 rounded text-[11px]">ESC</kbd>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
        {numeric && <button onClick={() => { onSelectMatch(q); onClose(); }} className="w-full text-left p-3 rounded-lg bg-[#1f1f24] hover:bg-[#292a2e]">
          <div className="text-xs uppercase tracking-wider text-[#ffc640] font-bold">Match ID</div><div className="text-white font-mono mt-1">Open match #{q}</div>
        </button>}
        <section><div className="text-[11px] uppercase tracking-wider text-white/50 font-bold px-2 mb-1">Heroes</div>
          <div className="grid sm:grid-cols-2 gap-1.5">{filteredHeroes.map(h => <button key={h.id} onClick={() => { onSelectHero(h.id); onClose(); }} className="flex items-center gap-3 p-2 rounded-lg bg-[#1f1f24]/70 hover:bg-[#292a2e] text-left">
            <img src={h.img} alt="" className="w-9 h-9 rounded object-cover" /><span className="text-sm font-bold text-white">{h.localized_name}</span>
          </button>)}</div>
        </section>
        <section><div className="text-[11px] uppercase tracking-wider text-white/50 font-bold px-2 mb-1">Players</div>
          {loading && <div className="p-3 text-xs text-white/50">Searching OpenDota…</div>}
          {!loading && players.length === 0 && q && !numeric && <div className="p-3 text-xs text-white/40">No players found.</div>}
          <div className="grid sm:grid-cols-2 gap-1.5">{players.slice(0, 8).map(p => <button key={p.account_id} onClick={() => { onSelectPlayer(p.account_id); onClose(); }} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#1f1f24]/70 hover:bg-[#292a2e] text-left">
            <img src={p.avatarfull} alt="" className="w-8 h-8 rounded-full" /><div><div className="text-sm font-bold text-white">{p.personaname}</div><div className="text-[10px] text-white/40 font-mono">{p.account_id}</div></div>
          </button>)}</div>
        </section>
      </div>
      <div className="px-4 py-2.5 bg-[#121317] border-t border-white/[0.06] text-[11px] text-white/40">Data is fetched from OpenDota. No simulated search results.</div>
    </div>
  </div>;
};
