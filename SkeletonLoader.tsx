import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#1f1f24] rounded-lg ${className}`} />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded-xl bg-[#1a1b20] border border-white/[0.04] flex flex-col gap-3 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
    <Skeleton className="w-full h-10 mt-2" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full bg-[#1a1b20] rounded-xl overflow-hidden border border-white/[0.04]">
    <div className="p-4 bg-[#121317] border-b border-white/[0.05] flex justify-between">
      <Skeleton className="w-32 h-4" />
      <Skeleton className="w-20 h-4" />
    </div>
    <div className="p-4 flex flex-col gap-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="w-36 h-4" />
          </div>
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
      ))}
    </div>
  </div>
);
