import React from 'react';
import { GlassSurface } from '../common/GlassSurface';
import { Skeleton } from '../common/Skeleton';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

export const WeatherHeroSkeleton: React.FC = () => {
  const { settings } = useSettingsStore();
  const isCompact = settings.contentDensity === 'compact';

  return (
    <GlassSurface className={`${isCompact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 lg:p-7'} flex flex-col gap-4 sm:gap-5 w-full min-h-[220px]`}>
      {/* Upper Row Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left block: Huge temp + condition */}
        <div className="flex items-center gap-5">
          <Skeleton className="w-28 h-16 sm:h-20" />
          <div className="flex flex-col gap-2 border-l border-white/10 pl-5">
            <Skeleton className="w-36 h-6" />
            <Skeleton className="w-48 h-4" />
          </div>
        </div>

        {/* Right block: Stats pill skeleton */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-40 h-8" />
        </div>
      </div>

      <div className="w-full h-px bg-white/10" />

      {/* Hourly forecast skeleton */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 w-full pt-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 py-2">
            <Skeleton className="w-10 h-3" />
            <Skeleton className="w-8 h-8" variant="circular" />
            <Skeleton className="w-12 h-4" />
          </div>
        ))}
      </div>
    </GlassSurface>
  );
};
