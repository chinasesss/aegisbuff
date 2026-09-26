import React, { useState } from 'react';

interface ReplayModalProps {
  incident: {
    matchId: string;
    timestamp: string;
    title: string;
    description: string;
    imageUrl: string;
  } | null;
  onClose: () => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({ incident, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(45);

  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 lg:p-6 bg-black/85 backdrop-blur-md">
      <div
        className="w-full max-w-4xl bg-[#1a1b20] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#121317] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-[#93000a] text-white text-[10px] font-['JetBrains_Mono'] font-bold uppercase">
              TACTICAL INCIDENT REPLAY
            </span>
            <span className="font-['Space_Grotesk'] text-[15px] font-bold text-white">
              Match #{incident.matchId} · {incident.timestamp}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#292a2e] hover:bg-[#343439] text-[#e7bcbb] flex items-center justify-center text-[14px] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Video Stage with HUD Overlays */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <img
            src={incident.imageUrl}
            alt={incident.title}
            className="w-full h-full object-cover filter brightness-90"
          />

          {/* Minimap Tactical Bird-Eye Radar Simulation */}
          <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex flex-col gap-1 z-10 text-[11px] font-['JetBrains_Mono']">
            <span className="text-[#ffc640] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">map</span>
              ROSHAN PIT 3D PERSPECTIVE
            </span>
            <span className="text-[#e7bcbb]/80">Camera Height: 1,600 units</span>
            <span className="text-[#10b981]">Vision Radius: 1,800 (Night Sentry active)</span>
          </div>

          {/* Tactical Mistake Annotation Box */}
          <div className="absolute bottom-16 left-6 right-6 p-3 rounded-xl bg-[#0d0e12]/90 backdrop-blur-md border border-[#ff525b]/50 shadow-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-[#ff525b] text-[24px] shrink-0 mt-0.5">
              warning
            </span>
            <div>
              <span className="font-['Space_Grotesk'] text-[13px] font-bold text-white block">
                {incident.title}
              </span>
              <p className="font-['Inter'] text-[12px] text-[#e7bcbb]/80 mt-0.5">
                {incident.description}
              </p>
            </div>
          </div>

          {/* Center Play Button Overlay */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute z-10 w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-all transform hover:scale-105"
          >
            <span className="material-symbols-outlined text-[36px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>

        {/* Playback Scrubbing Bar */}
        <div className="p-4 bg-[#121317] border-t border-white/[0.06] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#e7bcbb]/70">
            <span>Incident Frame: {incident.timestamp} (Slow Mo 0.5x)</span>
            <span className="text-[#ff525b] font-bold">Unforced Throw Delta: -2,400 Gold</span>
          </div>
          <div className="w-full flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-[#ff525b] h-1.5 bg-[#292a2e] rounded-lg cursor-pointer"
            />
            <span className="font-['JetBrains_Mono'] text-[11px] text-white">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
