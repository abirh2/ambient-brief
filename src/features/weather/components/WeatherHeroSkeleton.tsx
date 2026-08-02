import React from 'react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { Skeleton } from '../../../components/common/Skeleton';
import { useSettingsStore } from '../../../stores/settingsStore';

export const WeatherHeroSkeleton: React.FC = () => {
  const { settings } = useSettingsStore();
  const isCompact = settings.contentDensity === 'compact';

  return (
    <GlassSurface className={`weather-hero-card ${isCompact ? 'p-4' : 'p-4 sm:p-5'} flex flex-col gap-3 w-full min-h-[220px]`}>
      {/* Upper Row Skeleton */}
      <div className="flex flex-col gap-3">
        {/* Left block: Huge temp + condition */}
        <div className="flex items-center gap-5">
          <Skeleton className="w-28 h-16 sm:h-20" />
          <div className="flex flex-col gap-2 border-l border-white/10 pl-5">
            <Skeleton className="w-36 h-6" />
            <Skeleton className="w-48 h-4" />
          </div>
        </div>

        {/* Right block: Stats pill skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-56 h-6" />
          <Skeleton className="w-32 h-6" />
        </div>
      </div>

      <div className="w-full h-px bg-white/10" />

      {/* Hourly forecast skeleton */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 w-full pt-1">
        {Array.from({ length: 6 }).map((_, i) => (
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
