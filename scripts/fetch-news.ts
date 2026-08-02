import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { GeneratedNewsFeedSchema, type GeneratedNewsFeed } from '../src/features/news/generatedFeedSchemas.ts';
import { NEWS_CATEGORIES, type Headline, type NewsCategory } from '../src/features/news/model.ts';
import { deduplicateHeadlines, stripPublisherSuffix } from '../src/features/news/utils/deduplication.ts';
import { rankHeadlines } from '../src/features/news/utils/ranking.ts';
import { formatPublisherName } from '../src/features/news/utils/sourceMapper.ts';
import { getCanonicalArticleUrl, getPublisherDomain, getSafeImageUrl } from '../src/features/news/utils/urls.ts';

const API_ENDPOINT = 'https://api.currentsapi.services/v2/latest-news';
const DEFAULT_OUTPUT_PATH = resolve('public/data/news-feed.json');
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ARTICLES_PER_CATEGORY = 16;

const CanonicalCategorySchema = z.enum([
  'general', 'society', 'science_technology', 'politics_government',
  'economy_business_finance', 'arts_culture_entertainment', 'lifestyle_leisure',
  'human_interest', 'sport', 'crime_law_justice', 'education', 'environment',
  'labour', 'health', 'automotive', 'real_estate',
]);

const CurrentsArticleSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().nullable().optional(),
  url: z.string(),
  author: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  language: z.string().optional(),
  category: z.array(CanonicalCategorySchema).default([]),
  published: z.string(),
}).passthrough();

const CurrentsResponseSchema = z.object({
  status: z.literal('ok'),
  news: z.array(CurrentsArticleSchema),
  page: z.number().int().optional(),
}).passthrough();

type CurrentsArticle = z.infer<typeof CurrentsArticleSchema>;

interface RequestDefinition {
  id: 'broad' | 'us' | 'business' | 'sports' | 'entertainment';
  ownerCategories: NewsCategory[];
  category?: z.infer<typeof CanonicalCategorySchema>;
  country?: 'US';
  pageSize: number;
}

export const REQUEST_PLAN: readonly RequestDefinition[] = [
  { id: 'broad', ownerCategories: ['Top', 'World', 'Technology', 'Science'], pageSize: 100 },
  { id: 'us', ownerCategories: ['U.S.'], country: 'US', pageSize: 60 },
  { id: 'business', ownerCategories: ['Business'], category: 'economy_business_finance', pageSize: 50 },
  { id: 'sports', ownerCategories: ['Sports'], category: 'sport', pageSize: 40 },
  { id: 'entertainment', ownerCategories: ['Entertainment'], category: 'arts_culture_entertainment', pageSize: 40 },
] as const;

interface GenerateOptions {
  apiKey: string;
  outputPath?: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  timeoutMs?: number;
}

function normalizeTimestamp(value: string): string | undefined {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
}

function categoriesForArticle(article: CurrentsArticle, request: RequestDefinition): NewsCategory[] {
  const categories = new Set<NewsCategory>();
  if (request.id === 'us') categories.add('U.S.');
  if (request.id === 'business') categories.add('Business');
  if (request.id === 'sports') categories.add('Sports');
  if (request.id === 'entertainment') categories.add('Entertainment');

  for (const category of article.category) {
    if (category === 'economy_business_finance') categories.add('Business');
    if (category === 'science_technology') {
      categories.add('Technology');
      categories.add('Science');
    }
    if (category === 'health' || category === 'environment') categories.add('Science');
    if (category === 'sport') categories.add('Sports');
    if (category === 'arts_culture_entertainment') categories.add('Entertainment');
    if (category === 'general' || category === 'politics_government' || category === 'society' || category === 'crime_law_justice') {
      categories.add('World');
    }
  }

  const isSoft = categories.has('Sports') || categories.has('Entertainment');
  if (!isSoft || categories.size > 1) categories.add('Top');
  if (categories.size === 0) {
    categories.add('World');
    categories.add('Top');
  }
  return NEWS_CATEGORIES.filter((category) => categories.has(category));
}

export function normalizeCurrentsArticle(
  rawArticle: unknown,
  request: RequestDefinition = REQUEST_PLAN[0],
): Headline | undefined {
  const article = CurrentsArticleSchema.parse(rawArticle);
  const url = getCanonicalArticleUrl(article.url);
  const publishedAt = normalizeTimestamp(article.published);
  const title = article.title.replace(/\s+/g, ' ').trim();
  if (!url || !publishedAt || title.length < 8) return undefined;

  const publisherDomain = getPublisherDomain(url);
  if (!publisherDomain) return undefined;
  const publisher = formatPublisherName(publisherDomain);
  const description = article.description?.replace(/\s+/g, ' ').trim() || undefined;
  const imageUrl = article.image ? getSafeImageUrl(article.image) : undefined;
  const stableId = article.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96) ||
    createHash('sha256').update(url).digest('hex').slice(0, 24);

  return {
    id: `currents-${stableId}`,
    title: stripPublisherSuffix(title, publisher),
    ...(description ? { description } : {}),
    publisher,
    publisherDomain,
    publishedAt,
    url,
    ...(imageUrl ? { imageUrl } : {}),
    categories: categoriesForArticle(article, request),
  };
}

function buildRequestUrl(request: RequestDefinition): string {
  const params = new URLSearchParams({
    language: 'en',
    page_number: '1',
    page_size: String(request.pageSize),
  });
  if (request.category) params.set('category', request.category);
  if (request.country) params.set('country', request.country);
  return `${API_ENDPOINT}?${params.toString()}`;
}

async function fetchRequest(
  request: RequestDefinition,
  apiKey: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<Headline[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(buildRequestUrl(request), {
      signal: controller.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new Error(`Currents request failed with HTTP ${response.status}`);
    const payload = CurrentsResponseSchema.parse(await response.json());
    return payload.news.flatMap((article) => {
      const normalized = normalizeCurrentsArticle(article, request);
      return normalized ? [normalized] : [];
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readPreviousFeed(outputPath: string): Promise<GeneratedNewsFeed | undefined> {
  try {
    return GeneratedNewsFeedSchema.parse(JSON.parse(await readFile(outputPath, 'utf8')));
  } catch {
    return undefined;
  }
}

async function writeAtomically(outputPath: string, feed: GeneratedNewsFeed): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(feed, null, 2)}\n`, { encoding: 'utf8', mode: 0o644 });
    GeneratedNewsFeedSchema.parse(JSON.parse(await readFile(temporaryPath, 'utf8')));
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function generateNewsFeed(options: GenerateOptions): Promise<GeneratedNewsFeed> {
  if (!options.apiKey.trim()) throw new Error('CURRENTS_API_KEY is required');
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT_PATH;
  const previousFeed = await readPreviousFeed(outputPath);
  const generatedAt = (options.now ?? new Date()).toISOString();
  const results = await Promise.allSettled(REQUEST_PLAN.map(async (request) => ({
    request,
    headlines: await fetchRequest(request, options.apiKey, options.fetchImpl ?? fetch, options.timeoutMs ?? REQUEST_TIMEOUT_MS),
  })));
  const successes = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
  const failedRequests = results.length - successes.length;
  if (successes.length === 0) throw new Error('Every Currents request failed; the existing feed was preserved');

  const beforeDeduplication = successes.flatMap(({ headlines }) => headlines);
  const deduplicated = deduplicateHeadlines(beforeDeduplication);
  const successfulRequestIds = new Set(successes.map(({ request }) => request.id));
  const categories = Object.fromEntries(NEWS_CATEGORIES.map((category) => {
    const owner = REQUEST_PLAN.find((request) => request.ownerCategories.includes(category));
    if (owner && !successfulRequestIds.has(owner.id)) return [category, previousFeed?.categories[category] ?? []];
    const candidates = deduplicated.filter((headline) => headline.categories.includes(category));
    return [category, rankHeadlines(candidates, [category], generatedAt).slice(0, MAX_ARTICLES_PER_CATEGORY)];
  })) as GeneratedNewsFeed['categories'];

  const feed = GeneratedNewsFeedSchema.parse({
    schemaVersion: 1,
    provider: 'currents',
    generatedAt,
    sourceFetchedAt: generatedAt,
    status: failedRequests === 0 ? 'success' : 'partial',
    categories,
    metadata: {
      requestCount: REQUEST_PLAN.length,
      successfulRequests: successes.length,
      failedRequests,
      articleCountBeforeDeduplication: beforeDeduplication.length,
      articleCountAfterDeduplication: deduplicated.length,
    },
  });
  await writeAtomically(outputPath, feed);
  return feed;
}

async function main(): Promise<void> {
  const apiKey = process.env.CURRENTS_API_KEY;
  if (!apiKey) throw new Error('CURRENTS_API_KEY is required');
  const feed = await generateNewsFeed({ apiKey });
  console.log(`News feed updated: ${feed.metadata.successfulRequests}/${feed.metadata.requestCount} requests succeeded, ${feed.metadata.articleCountAfterDeduplication} unique articles.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error && error.message === 'CURRENTS_API_KEY is required'
      ? error.message
      : 'News feed update failed. The previous valid feed, if present, was preserved.';
    console.error(message);
    process.exitCode = 1;
  });
}
