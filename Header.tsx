import React, { useEffect, useState } from 'react';
import { PageRoute } from '../../types';
import { authService } from '../../services/authService';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  onOpenSearch: () => void;
  onOpenStream: () => void;
  onSearchSubmit: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenSearch,
  onOpenStream,
  onSearchSubmit,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [user, setUser] = useState(authService.getCurrentUser());
  useEffect(() => { authService.hydrate(); const h=(e:Event)=>setUser((e as CustomEvent).detail); window.addEventListener('aegis_auth_changed',h); return ()=>window.removeEventListener('aegis_auth_changed',h); }, []);

  const handleSearchKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onSearchSubmit(searchInput.trim());
    setSearchInput('');
  };

  const navItems: { key: PageRoute; label: string; isAi?: boolean }[] = [
    { key: 'home', label: 'Home' },
    { key: 'players', label: 'Players' },
    { key: 'matches', label: 'Matches' },
    { key: 'heroes', label: 'Heroes' },
    { key: 'rankings', label: 'Rankings' },
    { key: 'builds', label: 'Builds' },
    { key: 'meta', label: 'Meta' },
    { key: 'esports', label: 'Esports' },
    { key: 'ai-coach', label: 'AI Coach', isAi: true },
    { key: 'favorites', label: 'Favorites' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0d0e12]/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.6)] border-b border-white/[0.04]">
      {/* Primary Top Bar */}
      <div className="h-16 w-full px-4 lg:px-6 flex items-center justify-between gap-3">
        {/* Brand & Nav */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 group text-left cursor-pointer transition-transform active:scale-95"
          >
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 drop-shadow-[0_0_8px_rgba(255,82,91,0.6)]" viewBox="0 0 40 40" fill="none">
                <path d="M20 2L5 8V19C5 28.5 11.4 37.2 20 39.5C28.6 37.2 35 28.5 35 19V8L20 2Z" fill="#1f1f24" stroke="#ff525b" strokeWidth="2.5" />
                <path d="M20 7L10 11.5V19C10 25.8 14.3 32.1 20 34C25.7 32.1 30 25.8 30 19V11.5L20 7Z" fill="#93000a" />
                <path d="M20 11L15 18H25L20 11Z" fill="#ffffff" />
                <path d="M20 28L15 21H25L20 28Z" fill="#ffc640" />
              </svg>
            </div>
            <span className="font-['Space_Grotesk'] text-[20px] tracking-wider uppercase text-[#e3e2e8] font-bold">
              AEGIS<span className="text-[#ff525b]">BUFF</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`px-3 py-1.5 rounded-lg font-['Space_Grotesk'] text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white bg-[#292a2e] shadow-sm'
                      : 'text-[#e7bcbb]/80 hover:text-white hover:bg-[#292a2e]/60'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.isAi && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold uppercase tracking-widest bg-[#ff525b] text-white shadow-[0_0_10px_rgba(255,82,91,0.5)]">
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Functional Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-3">
          <form onSubmit={handleSearchKey} className="w-full relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search player, Steam ID or match ID..."
              className="w-full bg-[#1a1b20] hover:bg-[#1f1f24] focus:bg-[#121317] pl-9 pr-14 py-2 rounded-lg text-[#e3e2e8] placeholder:text-[#e7bcbb]/50 text-[13px] font-['Inter'] shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] border border-white/[0.06] focus:border-[#ff525b]/60 focus:outline-none transition-all"
            />
            <span className="material-symbols-outlined absolute left-2.5 text-[#e7bcbb]/60 text-[18px]">
              search
            </span>
            <button
              type="button"
              onClick={onOpenSearch}
              className="absolute right-2 font-['JetBrains_Mono'] px-1.5 py-0.5 bg-[#292a2e] text-[#e7bcbb] rounded text-[10px] border border-white/[0.08] hover:text-white cursor-pointer"
            >
              ⌘K
            </button>
          </form>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* User Account / Profile */}
          {user ? (
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 p-1 pr-3 bg-[#1a1b20] hover:bg-[#292a2e] transition-colors rounded-lg border border-white/[0.05] cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#ff525b] flex items-center justify-center font-bold text-white shadow-sm overflow-hidden">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="font-['Space_Grotesk'] text-[12px] font-bold leading-tight text-white">
                  {user.connectedPlayerName || user.username}
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] font-semibold text-[#ffc640] leading-none flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">shield</span>
                  Steam account
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => authService.loginWithSteam()}
              className="px-3 py-1.5 rounded-lg bg-[#ff525b] hover:bg-[#ff404a] text-white font-['Space_Grotesk'] text-[12px] font-bold uppercase transition-all shadow-md cursor-pointer"
            >
              Sign in with Steam
            </button>
          )}
        </div>
      </div>

      <div className="h-8 w-full bg-[#0d0e12]/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between text-[#e7bcbb] text-[12px] font-['Inter'] border-t border-white/[0.04]">
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <span className="w-2 h-2 rounded-full bg-[#89ceff]"></span>
          <span>Post-match data: OpenDota</span>
        </div>
        <button onClick={onOpenStream} className="text-[11px] uppercase tracking-wider text-white/60 hover:text-white">Live telemetry status</button>
      </div>
    </header>
  );
};
