import React from 'react';
import { PageType } from '../types';

interface FooterProps {
  onNavigate: (page: PageType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#0d0e12] text-[#e7bcbb] pt-12 pb-8 border-t border-white/[0.04]">
      <div className="w-full max-w-7xl px-4 lg:px-6 mx-auto flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Brand Info */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 drop-shadow-[0_0_6px_rgba(255,82,91,0.6)]" viewBox="0 0 40 40" fill="none">
                  <path d="M20 2L5 8V19C5 28.5 11.4 37.2 20 39.5C28.6 37.2 35 28.5 35 19V8L20 2Z" fill="#1f1f24" stroke="#ff525b" strokeWidth="2.5" />
                  <path d="M20 7L10 11.5V19C10 25.8 14.3 32.1 20 34C25.7 32.1 30 25.8 30 19V11.5L20 7Z" fill="#93000a" />
                  <path d="M20 11L15 18H25L20 11Z" fill="#ffffff" />
                  <path d="M20 28L15 21H25L20 28Z" fill="#ffc640" />
                </svg>
              </div>
              <span className="font-['Space_Grotesk'] text-[18px] tracking-wider uppercase text-[#e3e2e8] font-bold">
                Aegis<span className="text-[#ff525b]">Buff</span>
              </span>
            </div>
            <p className="font-['Inter'] text-[14px] text-[#e7bcbb]/80 max-w-md leading-relaxed">
              Next-generation competitive intelligence and telemetry analytics platform engineered for professional Dota 2 teams, analysts, and leaderboard grinders.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2.5 py-1 rounded bg-[#1f1f24] font-['JetBrains_Mono'] text-[11px] text-[#ffc640] flex items-center gap-1 border border-white/[0.04]">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Steam WebAPI Compliant
              </span>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1f1f24] font-['JetBrains_Mono'] text-[11px] text-[#e7bcbb] border border-white/[0.04]">
                <span className="material-symbols-outlined text-[14px] text-[#89ceff]">dark_mode</span>
                <span>Dark Pro (Fixed)</span>
              </div>
            </div>
          </div>

          {/* Platform & Data */}
          <div className="flex flex-col gap-2">
            <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-wider text-[#e3e2e8] font-bold mb-1">
              Platform & Data
            </span>
            <button
              onClick={() => onNavigate('meta')}
              className="text-left font-['Inter'] text-[13px] text-[#e7bcbb]/70 hover:text-white transition-colors"
            >
              OpenDota dataset Matrix
            </button>
            <button
              onClick={() => onNavigate('matches')}
              className="text-left font-['Inter'] text-[13px] text-[#e7bcbb]/70 hover:text-white transition-colors"
            >
              Pro Circuit Telemetry
            </button>
            <button
              onClick={() => onNavigate('heroes')}
              className="text-left font-['Inter'] text-[13px] text-[#e7bcbb]/70 hover:text-white transition-colors"
            >
              Hero Meta Tiers & Counters
            </button>
            <button
              onClick={() => onNavigate('rankings')}
              className="text-left font-['Inter'] text-[13px] text-[#e7bcbb]/70 hover:text-white transition-colors"
            >
              Immortal Leaderboard
            </button>
          </div>

          {/* Ecosystem */}
          <div className="flex flex-col gap-2">
            <span className="font-['Space_Grotesk'] text-[11px] uppercase tracking-wider text-[#e3e2e8] font-bold mb-1">
              Ecosystem & Tools
            </span>
            <button
              onClick={() => onNavigate('ai-coach')}
              className="text-left font-['Inter'] text-[13px] text-[#e7bcbb]/70 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Aegis Neural Coach v4.2</span>
              <span className="text-[10px] text-[#ff525b] font-bold uppercase">New</span>
            </button>
            <button
              onClick={() => onNavigate('players')}
              className="text-left font-['Inter'] text-[13px] text-[#e7bcbb]/70 hover:text-white transition-colors"
            >
              Steam ID Profile Sync
            </button>
            <button
              onClick={() => onNavigate('esports')}
              className="text-left font-['Inter'] text-[13px] text-[#e7bcbb]/70 hover:text-white transition-colors"
            >
              Live Pro Streams
            </button>
            <button
              onClick={() => onNavigate('builds')}
              className="text-left font-['Inter'] text-[13px] text-[#e7bcbb]/70 hover:text-white transition-colors"
            >
              Pro Item Build Curves
            </button>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-6 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-['Inter'] text-[#e7bcbb]/60">
          <p>© 2025 AegisBuff Analytics. Dota 2 is a registered trademark of Valve Corporation. All game assets, images, and telemetry data are property of Valve Corporation.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Cookie Settings</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
