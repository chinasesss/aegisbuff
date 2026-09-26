import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Unable to load data right now',
  message = 'There was an issue communicating with the Dota 2 statistics service. Please check your connection and retry.',
  onRetry,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-[#1a1b20] border border-[#ff525b]/30 shadow-2xl flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-[#93000a]/20 border border-[#ff525b]/40 flex items-center justify-center text-[#ff525b]">
        <span className="material-symbols-outlined text-[28px]">warning</span>
      </div>

      <div>
        <h3 className="font-['Space_Grotesk'] text-[18px] font-bold text-white">
          {title}
        </h3>
        <p className="font-['Inter'] text-[13px] text-[#e7bcbb]/80 mt-1 max-w-md">
          {message}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl bg-[#ff525b] hover:bg-[#ff404a] text-white font-['Space_Grotesk'] text-[13px] font-bold shadow-lg shadow-[#ff525b]/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Retry Request</span>
          </button>
        )}


      </div>
    </div>
  );
};
