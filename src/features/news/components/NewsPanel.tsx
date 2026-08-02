import React, { useState } from 'react';
import { Newspaper, SlidersHorizontal, AlertCircle, RefreshCw, Clock, Inbox } from 'lucide-react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { FeaturedStory } from './FeaturedStory';
import { StoryList } from './StoryList';
import { NewsSkeleton } from './NewsSkeleton';
import type { Headline, NewsCategory, NewsState } from '../model';
import { useSettingsStore } from '../../../stores/settingsStore';

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
  const categories: NewsCategory[] =
    settings.newsCategories.length > 0 ? settings.newsCategories : ['Top', 'U.S.', 'Technology'];
  const [activeCategory, setActiveCategory] = useState<NewsCategory>(categories[0] || 'Top');

  const currentCategory = categories.includes(activeCategory) ? activeCategory : categories[0];
  const isCompact = settings.contentDensity === 'compact';

  // 1. Loading state
  if (state.status === 'loading') {
    return <NewsSkeleton />;
  }

  // 2. Empty state
  if (state.status === 'empty') {
    return (
      <GlassSurface className={`news-panel-card news-empty-state ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full min-h-[380px]`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
              Top Stories
            </h2>
          </div>
          <button
            type="button"
            onClick={onCustomize}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>Customize</span>
          </button>
        </div>

        {/* Empty state message container */}
        <div
          role="status"
          aria-live="polite"
          className="flex-grow flex flex-col items-center justify-center text-center p-6 gap-3 bg-slate-900/30 rounded-xl border border-white/5"
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
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
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
      <GlassSurface className={`news-panel-card news-error-state ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full min-h-[380px]`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
              Top Stories
            </h2>
          </div>
        </div>

        {/* Error state message container */}
        <div
          role="alert"
          className="flex-grow flex flex-col items-center justify-center text-center p-6 gap-3 bg-rose-950/20 rounded-xl border border-rose-800/30"
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
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
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
    <GlassSurface className={`news-panel-card ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full`}>
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-sans font-medium w-fit ${isCached ? 'bg-amber-950/70 border border-amber-700/40 text-amber-200' : 'bg-white/5 border border-white/5 text-slate-400'}`}>
        <Clock className={`w-3.5 h-3.5 shrink-0 ${isCached ? 'text-amber-400' : 'text-slate-500'}`} />
        <span>{state.updatedText}</span>
      </div>

      {/* Header & Categories bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
            Top Stories
          </h2>
        </div>

        {/* Category Pills + Customize Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900/40 p-1 rounded-lg border border-white/5">
            {categories.map((category) => {
              const isSelected = currentCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={isSelected}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Stories list container */}
      <div className="news-scroll-container flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-1 no-scrollbar">
        {featured ? (
          <>
            <FeaturedStory article={featured} />
            <StoryList articles={secondary} />
          </>
        ) : (
          <div role="status" className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-900/30 p-6 text-center">
            <Inbox className="h-7 w-7 text-slate-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-200">No {currentCategory} stories in this update</p>
            <p className="text-xs text-slate-400">Try another category or refresh after the next scheduled news update.</p>
          </div>
        )}
      </div>
    </GlassSurface>
  );
};
