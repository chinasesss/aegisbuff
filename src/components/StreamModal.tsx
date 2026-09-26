import React from 'react';
interface StreamModalProps { isOpen: boolean; onClose: () => void; onInspectMatch: () => void; }
export const StreamModal: React.FC<StreamModalProps> = ({ isOpen, onClose, onInspectMatch }) => {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onMouseDown={onClose}>
    <div className="w-full max-w-2xl bg-[#1a1b20] border border-white/10 rounded-2xl shadow-2xl p-6" onMouseDown={e=>e.stopPropagation()}>
      <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold text-white">Live telemetry</h2><button onClick={onClose} className="text-white/50 hover:text-white">✕</button></div>
      <div className="rounded-xl border border-[#ffc640]/20 bg-[#ffc640]/5 p-5">
        <div className="text-[#ffc640] font-bold text-sm uppercase tracking-wider mb-2">Source status</div>
        <p className="text-white/70 text-sm leading-6">AegisBuff does not fabricate a live Dota 2 feed. The current data pipeline provides real post-match/professional data through OpenDota. A separate live telemetry agent is required before this panel can show live game state.</p>
      </div>
      <div className="flex gap-3 mt-5"><button onClick={onInspectMatch} className="px-4 py-2.5 rounded-xl bg-[#ff525b] text-white font-bold">Open real match data</button><button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/5 text-white/70">Close</button></div>
    </div>
  </div>;
};
