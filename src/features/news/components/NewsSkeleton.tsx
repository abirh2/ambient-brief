import React from 'react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { Skeleton } from '../../../components/common/Skeleton';
import { useSettingsStore } from '../../../stores/settingsStore';

export const NewsSkeleton: React.FC = () => {
  const { settings } = useSettingsStore();
  const isCompact = settings.contentDensity === 'compact';

  return (
    <GlassSurface className={`news-panel-card ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full min-h-[380px]`}>
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <Skeleton className="w-32 h-6" />
        <div className="flex gap-2">
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
        </div>
      </div>

      {/* Featured story skeleton */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-4" variant="circular" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
        {/* Featured headline */}
        <Skeleton className="w-full h-6" />
        <Skeleton className="w-3/4 h-6" />
        {/* Summary lines */}
        <div className="flex flex-col gap-1.5 pt-1">
          <Skeleton className="w-full h-3.5" variant="text" />
          <Skeleton className="w-11/12 h-3.5" variant="text" />
          <Skeleton className="w-4/5 h-3.5" variant="text" />
        </div>
      </div>

      {/* 3 Secondary stories skeletons */}
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-slate-900/30 border border-white/5 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-12 h-3" />
              <Skeleton className="w-20 h-3" />
            </div>
            <Skeleton className="w-full h-4" />
          </div>
        ))}
      </div>
    </GlassSurface>
  );
};
