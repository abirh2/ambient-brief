import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { GeneratedNewsFeedSchema } from '../../src/features/news/generatedFeedSchemas';
import { NEWS_CATEGORIES } from '../../src/features/news/model';
import { generateNewsFeed, NewsUpdateError, normalizeCurrentsArticle, REQUEST_PLAN } from '../fetch-news';

const temporaryDirectories: string[] = [];

async function temporaryOutputPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'ambient-news-test-'));
  temporaryDirectories.push(directory);
  return join(directory, 'news-feed.json');
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function rawArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'article-1',
    title: 'Science agency publishes a significant climate research update - Example',
    description: 'A validated description from the provider.',
    url: 'https://www.example.com/world/story?utm_source=feed',
    image: 'https://images.example.com/story.jpg',
    category: ['science_technology', 'environment'],
    published: '2026-08-02 12:00:00 +0000',
    ...overrides,
  };
}

function successfulFetch(): typeof fetch {
  return async (input) => {
    const url = new URL(String(input));
    const category = url.searchParams.get('category') ?? 'general';
    const country = url.searchParams.get('country');
    const suffix = country ? 'us' : category;
    return new Response(JSON.stringify({
      status: 'ok',
      page: 1,
      news: [rawArticle({
        id: `article-${suffix}`,
        title: `Government and economy update for ${suffix}`,
        url: `https://${suffix.replaceAll('_', '-')}.example.com/story`,
        category: category === 'general' ? ['general', 'science_technology'] : [category],
      })],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
}

describe('Currents normalization', () => {
  it('normalizes timestamps, publisher identity, URLs, images, and categories', () => {
    expect(normalizeCurrentsArticle(rawArticle())).toMatchObject({
      title: 'Science agency publishes a significant climate research update',
      publisher: 'Example',
      publisherDomain: 'example.com',
      publishedAt: '2026-08-02T12:00:00.000Z',
      url: 'https://www.example.com/world/story',
      imageUrl: 'https://images.example.com/story.jpg',
      categories: expect.arrayContaining(['Top', 'Technology', 'Science']),
    });
  });

  it('rejects invalid article URLs and timestamps and drops invalid images', () => {
    expect(normalizeCurrentsArticle(rawArticle({ url: 'javascript:alert(1)' }))).toBeUndefined();
    expect(normalizeCurrentsArticle(rawArticle({ published: 'not-a-date' }))).toBeUndefined();
    expect(normalizeCurrentsArticle(rawArticle({ image: 'data:image/png,bad' }))).not.toHaveProperty('imageUrl');
  });
});

describe('generated news update', () => {
  it('runs in the Node 22 strip-only TypeScript mode used by GitHub Actions', () => {
    const environment = { ...process.env };
    delete environment.CURRENTS_API_KEY;
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', resolve('scripts/fetch-news.ts')],
      { encoding: 'utf8', env: environment },
    );
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe('CURRENTS_API_KEY is required');
    expect(result.stderr).not.toContain('ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX');
  });

  it('keeps every request within the Currents Developer-plan result cap', () => {
    expect(REQUEST_PLAN).toHaveLength(5);
    expect(REQUEST_PLAN.every((request) => request.pageSize <= 20)).toBe(true);
  });

  it('writes a schema-valid feed with no more than five requests', async () => {
    const outputPath = await temporaryOutputPath();
    const feed = await generateNewsFeed({ apiKey: 'temporary-test-key', outputPath, fetchImpl: successfulFetch(), now: new Date('2026-08-02T12:30:00Z') });
    expect(feed.metadata).toMatchObject({ requestCount: 5, successfulRequests: 5, failedRequests: 0 });
    expect(GeneratedNewsFeedSchema.parse(JSON.parse(await readFile(outputPath, 'utf8')))).toEqual(feed);
    expect(await readFile(outputPath, 'utf8')).not.toContain('temporary-test-key');
  });

  it('produces partial output and retains a failed category from the previous valid feed', async () => {
    const outputPath = await temporaryOutputPath();
    const initial = await generateNewsFeed({ apiKey: 'temporary-test-key', outputPath, fetchImpl: successfulFetch(), now: new Date('2026-08-02T12:30:00Z') });
    const previousSports = initial.categories.Sports;
    const partiallyFailingFetch: typeof fetch = async (input, init) => {
      if (new URL(String(input)).searchParams.get('category') === 'sport') return new Response('{}', { status: 503 });
      return successfulFetch()(input, init);
    };
    const partial = await generateNewsFeed({ apiKey: 'temporary-test-key', outputPath, fetchImpl: partiallyFailingFetch, now: new Date('2026-08-02T13:00:00Z') });
    expect(partial.status).toBe('partial');
    expect(partial.metadata.failedRequests).toBe(1);
    expect(partial.categories.Sports).toEqual(previousSports);
  });

  it('preserves the previous file byte-for-byte when every request fails', async () => {
    const outputPath = await temporaryOutputPath();
    const existing = {
      schemaVersion: 1,
      provider: 'currents',
      generatedAt: '2026-08-02T12:30:00.000Z',
      sourceFetchedAt: '2026-08-02T12:30:00.000Z',
      status: 'success',
      categories: Object.fromEntries(NEWS_CATEGORIES.map((category) => [category, []])),
      metadata: { requestCount: 5, successfulRequests: 5, failedRequests: 0, articleCountBeforeDeduplication: 0, articleCountAfterDeduplication: 0 },
    };
    const original = `${JSON.stringify(existing, null, 2)}\n`;
    await writeFile(outputPath, original);
    const failedFetch: typeof fetch = async () => new Response('{}', { status: 503 });
    await expect(generateNewsFeed({ apiKey: 'temporary-test-key', outputPath, fetchImpl: failedFetch })).rejects.toThrow('existing feed was preserved');
    expect(await readFile(outputPath, 'utf8')).toBe(original);
  });

  it('reports safe per-request diagnostics without response bodies or credentials', async () => {
    const outputPath = await temporaryOutputPath();
    const failedFetch: typeof fetch = async () => new Response('sensitive-provider-body', { status: 400, statusText: 'Bad Request' });
    try {
      await generateNewsFeed({ apiKey: 'temporary-secret-value', outputPath, fetchImpl: failedFetch });
      throw new Error('Expected the update to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(NewsUpdateError);
      const updateError = error as NewsUpdateError;
      expect(updateError.diagnostics).toHaveLength(5);
      expect(updateError.diagnostics.every((diagnostic) => diagnostic.detail === 'HTTP 400 Bad Request')).toBe(true);
      expect(JSON.stringify(updateError)).not.toContain('sensitive-provider-body');
      expect(JSON.stringify(updateError)).not.toContain('temporary-secret-value');
    }
  });
});
