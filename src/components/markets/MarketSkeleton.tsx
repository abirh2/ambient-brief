import React from 'react';
import { GlassSurface } from '../common/GlassSurface';
import { Skeleton } from '../common/Skeleton';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

export const MarketSkeleton: React.FC = () => {
  const { settings } = useSettingsStore();
  const isCompact = settings.contentDensity === 'compact';

  return (
    <GlassSurface className={`${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full min-h-[380px]`}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <Skeleton className="w-28 h-6" />
        <Skeleton className="w-44 h-4" />
      </div>

      {/* Index summary card skeletons (3 cols) */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between">
              <Skeleton className="w-12 h-3" />
              <Skeleton className="w-10 h-3" />
            </div>
            <Skeleton className="w-20 h-5" />
            <Skeleton className="w-full h-6" />
          </div>
        ))}
      </div>

      {/* Row-level stock ticker skeletons */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/30 border border-white/5"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-12 h-4" />
              <Skeleton className="w-20 h-3" />
            </div>
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-16 h-5" />
          </div>
        ))}
      </div>
    </GlassSurface>
  );
};
