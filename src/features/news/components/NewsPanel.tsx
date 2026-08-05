import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';
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

export function getDefaultSecondaryStoryCount(width: number, height: number): number {
  return width >= 1200 && height <= 900 ? 2 : 4;
}

interface NewsPanelHeaderProps {
  categories: NewsCategory[];
  currentCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
  onCustomize?: () => void;
  updatedText?: string;
  isCached?: boolean;
}

function NewsPanelHeader({
  categories,
  currentCategory,
  onCategoryChange,
  onCustomize,
  updatedText,
  isCached = false,
}: NewsPanelHeaderProps) {
  return (
    <header className="news-panel-header section-rule">
      <div className="news-heading-group">
        <h2 className="panel-heading font-semibold tracking-tight">Top Stories</h2>
        {updatedText && (
          <div
            className={`status-note news-freshness ${isCached ? 'semantic-warning' : ''}`}
            aria-label={`News status: ${updatedText}`}
          >
            <span>{updatedText}</span>
          </div>
        )}
      </div>

      <div className="news-header-actions">
        <label className="news-category-control">
          <span className="sr-only">Section</span>
          <select
            value={currentCategory}
            onChange={(event) => onCategoryChange(event.target.value as NewsCategory)}
            aria-label="News category"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onCustomize}
          className="news-customize-action"
        >
          <span>Topics</span>
        </button>
      </div>
    </header>
  );
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
  const defaultSecondaryCount = getDefaultSecondaryStoryCount(viewport.width, viewport.height);

  // 1. Loading state
  if (state.status === 'loading') {
    return <NewsSkeleton />;
  }

  // 2. Empty state
  if (state.status === 'empty') {
    return (
      <GlassSurface className="news-panel-card news-empty-state panel-padding panel-stack flex flex-col min-h-[260px]">
        <NewsPanelHeader
          categories={categories}
          currentCategory={currentCategory}
          onCategoryChange={setActiveCategory}
          onCustomize={onCustomize}
        />

        {/* Empty state message container */}
        <div
          role="status"
          aria-live="polite"
          className="empty-state news-state-message"
        >
          <Inbox aria-hidden="true" />
          <div>
            <h3>No stories found for these categories</h3>
            <p>
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
        <NewsPanelHeader
          categories={categories}
          currentCategory={currentCategory}
          onCategoryChange={setActiveCategory}
          onCustomize={onCustomize}
        />

        {/* Error state message container */}
        <div
          role="alert"
          className="error-state is-error news-state-message"
        >
          <AlertCircle aria-hidden="true" />
          <div>
            <h3>News is temporarily unavailable</h3>
            <p>
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
      <NewsPanelHeader
        categories={categories}
        currentCategory={currentCategory}
        onCategoryChange={setActiveCategory}
        onCustomize={onCustomize}
        updatedText={state.updatedText}
        isCached={isCached}
      />

      {/* Stories list container */}
      <div className="news-content flex min-h-0 min-w-0 flex-col gap-3">
        {featured ? (
          <>
            <FeaturedStory article={featured} />
            <StoryList
              key={currentCategory}
              articles={secondary}
              defaultVisibleCount={defaultSecondaryCount}
            />
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
