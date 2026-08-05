import React from 'react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { Skeleton } from '../../../components/common/Skeleton';
import { useSettingsStore } from '../../../stores/settingsStore';

export const NewsSkeleton: React.FC = () => {
  const { settings } = useSettingsStore();
  const isCompact = settings.contentDensity === 'compact';

  return (
    <GlassSurface className={`news-panel-card panel-padding panel-stack flex flex-col min-h-[420px] ${isCompact ? 'is-density-compact' : ''}`}>
      <div className="news-panel-header section-rule">
        <div className="news-heading-group">
          <Skeleton className="w-28 h-5" />
          <Skeleton className="w-40 h-3" />
        </div>
        <div className="news-header-actions">
          <Skeleton className="w-28 h-9" />
          <Skeleton className="w-24 h-9" />
        </div>
      </div>

      <div className="featured-story featured-story-skeleton has-image">
        <div className="featured-story-copy">
          <div className="flex items-center gap-2">
            <Skeleton className="w-14 h-3" />
            <Skeleton className="w-24 h-3" />
          </div>
          <Skeleton className="w-full h-7" />
          <Skeleton className="w-4/5 h-7" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="w-full h-3.5" variant="text" />
            <Skeleton className="w-3/4 h-3.5" variant="text" />
          </div>
        </div>
        <Skeleton className="featured-story-image" />
      </div>

      <div className="story-list-container">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="story-list-item">
            <div className="story-list-copy">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-36 h-3" />
            </div>
            <Skeleton className="story-list-image" />
          </div>
        ))}
      </div>
    </GlassSurface>
  );
};
