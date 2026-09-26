import React from 'react';
import { PageRoute } from '../../types';

interface MobileBottomNavProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  onNavigate,
  onOpenSearch,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0e12]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors cursor-pointer ${
          currentPage === 'home' ? 'text-[#ff525b]' : 'text-[#e7bcbb]/60 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
        <span className="font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-wider">Home</span>
      </button>

      <button
        onClick={() => onNavigate('matches')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors cursor-pointer ${
          currentPage === 'matches' ? 'text-[#ff525b]' : 'text-[#e7bcbb]/60 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">sports_esports</span>
        <span className="font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-wider">Matches</span>
      </button>

      <button
        onClick={() => onNavigate('heroes')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors cursor-pointer ${
          currentPage === 'heroes' ? 'text-[#ff525b]' : 'text-[#e7bcbb]/60 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">shield</span>
        <span className="font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-wider">Heroes</span>
      </button>

      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-[#e7bcbb]/60 hover:text-white transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">search</span>
        <span className="font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-wider">Search</span>
      </button>

      <button
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors cursor-pointer ${
          currentPage === 'profile' || currentPage === 'player'
            ? 'text-[#ff525b]'
            : 'text-[#e7bcbb]/60 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">person</span>
        <span className="font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-wider">Profile</span>
      </button>
    </nav>
  );
};
