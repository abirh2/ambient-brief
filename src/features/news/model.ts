export const NEWS_CATEGORIES = [
  'Top',
  'U.S.',
  'World',
  'Business',
  'Technology',
  'Science',
  'Sports',
  'Entertainment',
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface Headline {
  id: string;
  title: string;
  description?: string;
  publisher: string;
  publisherDomain: string;
  publishedAt: string;
  url: string;
  imageUrl?: string;
  categories: NewsCategory[];
}

/** Compatibility alias for older feature imports. */
export type NewsArticle = Headline;

export type NewsState =
  | { status: 'loaded'; featured: Headline; secondary: Headline[]; updatedText: string }
  | { status: 'loading' }
  | { status: 'empty'; categoryName?: string }
  | { status: 'error'; errorMessage?: string }
  | { status: 'cached'; featured: Headline; secondary: Headline[]; updatedText: string };

export type NewsStateStatus = NewsState['status'];

export type { GeneratedNewsFeed } from './generatedFeedSchemas.ts';
