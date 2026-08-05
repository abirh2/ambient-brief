import React, { useState } from 'react';
import { SlidersHorizontal, AlertCircle, RefreshCw, Clock, Inbox } from 'lucide-react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { FeaturedStory } from './FeaturedStory';
import { StoryList } from './StoryList';
import { NewsSkeleton } from './NewsSkeleton';
import type { Headline, NewsCategory, NewsState } from '../model';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useViewportWidth } from '../../../hooks/useViewportWidth';

interface NewsPanelProps {
  state: NewsState;
  onCustomize?: () => void;
  onRetry?: () => void;
}

export function filterStoriesForCategory(
  stories: Headline[],
  category: NewsCategory,
): Headline[] {
  return stories.filter((story) => story.categories.includes(category));
}

export const NewsPanel: React.FC<NewsPanelProps> = ({
  state,
  onCustomize,
  onRetry,
}) => {
  const { settings } = useSettingsStore();
  const viewport = useViewportWidth();
  const categories: NewsCategory[] =
    settings.newsCategories.length > 0 ? settings.newsCategories : ['Top', 'U.S.', 'Technology'];
  const [activeCategory, setActiveCategory] = useState<NewsCategory>(categories[0] || 'Top');

  const currentCategory = categories.includes(activeCategory) ? activeCategory : categories[0];
  const compactHeight = viewport.width >= 1200 && viewport.height <= 900;
  const defaultSecondaryCount = compactHeight ? 1 : 3;

  // 1. Loading state
  if (state.status === 'loading') {
    return <NewsSkeleton />;
  }

  // 2. Empty state
  if (state.status === 'empty') {
    return (
      <GlassSurface className="news-panel-card news-empty-state panel-padding panel-stack flex flex-col min-h-[260px]">
        {/* Header */}
        <div className="section-rule flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <h2 className="panel-heading font-semibold tracking-tight">
              Top Stories
            </h2>
          </div>
          <button
            type="button"
            onClick={onCustomize}
            className="compact-control flex items-center gap-1 px-2.5 py-1 text-xs font-medium"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>Customize</span>
          </button>
        </div>

        {/* Empty state message container */}
        <div
          role="status"
          aria-live="polite"
          className="empty-state flex-grow flex flex-col items-center justify-center text-center p-6 gap-3"
        >
          <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 border border-white/10">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-base font-bold text-slate-200">No stories found for these categories</h3>
            <p className="text-xs text-slate-400">
              Try selecting another category or refresh the feed to load latest headlines.
            </p>
          </div>
          <button
            type="button"
            onClick={onCustomize}
            className="compact-control mt-2 px-4 py-2 text-xs font-semibold"
          >
            Manage categories
          </button>
        </div>
      </GlassSurface>
    );
  }

  // 3. Error state
  if (state.status === 'error') {
    return (
      <GlassSurface className="news-panel-card news-error-state panel-padding panel-stack flex flex-col min-h-[260px]">
        {/* Header */}
        <div className="section-rule flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <h2 className="panel-heading font-semibold tracking-tight">
              Top Stories
            </h2>
          </div>
        </div>

        {/* Error state message container */}
        <div
          role="alert"
          className="error-state is-error flex-grow flex flex-col items-center justify-center text-center p-6 gap-3"
        >
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-base font-bold text-slate-100">News is temporarily unavailable</h3>
            <p className="text-xs text-slate-300">
              {state.errorMessage ?? 'Your weather and market information are still available.'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <button
              type="button"
              onClick={onRetry}
              className="compact-control flex items-center gap-1 px-4 py-2 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </GlassSurface>
    );
  }

  // 4. Loaded or Cached state
  const isCached = state.status === 'cached';
  const allStories = [state.featured, ...state.secondary];
  const visibleStories = filterStoriesForCategory(allStories, currentCategory);
  const featured = visibleStories[0];
  const secondary = visibleStories.slice(1);

  return (
    <GlassSurface className="news-panel-card panel-padding panel-stack flex min-w-0 flex-col">
      <div className={`status-note flex items-center gap-1.5 font-medium w-fit ${isCached ? 'semantic-warning' : ''}`}>
        <Clock className={`w-3.5 h-3.5 shrink-0 ${isCached ? 'text-amber-400' : 'text-slate-500'}`} />
        <span>{state.updatedText}</span>
      </div>

      {/* Header & Categories bar */}
      <div className="section-rule flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="panel-heading font-semibold tracking-tight">
            Top Stories
          </h2>
        </div>

        {/* Category Pills + Customize Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="tonal-section flex items-center gap-1 p-1">
            {categories.map((category) => {
              const isSelected = currentCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={isSelected}
                  className="compact-control px-2.5 py-1 text-xs font-medium cursor-pointer"
                >
                  {category}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onCustomize}
            aria-label="Customize news categories"
            className="compact-control flex items-center gap-1 px-2.5 py-1 text-xs font-medium cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Stories list container */}
      <div className="news-content flex min-h-0 min-w-0 flex-col gap-3">
        {featured ? (
          <>
            <FeaturedStory article={featured} />
            <StoryList articles={secondary} defaultVisibleCount={defaultSecondaryCount} />
          </>
        ) : (
          <div role="status" className="empty-state flex min-h-44 flex-col items-center justify-center gap-2 p-6 text-center">
            <Inbox className="h-7 w-7 text-slate-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-200">No {currentCategory} stories in this update</p>
            <p className="text-xs text-slate-400">Try another category or refresh after the next scheduled news update.</p>
          </div>
        )}
      </div>
    </GlassSurface>
  );
};
