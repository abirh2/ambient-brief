import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { MARKET_INSTRUMENTS, type MarketInstrumentDefinition } from '../src/features/markets/instruments.ts';
import type { MarketInstrument, MarketSession, MarketSnapshot, MarketSymbolError } from '../src/features/markets/model.ts';
import { MarketSnapshotSchema } from '../src/features/markets/schemas.ts';

// Official Finnhub API docs: https://finnhub.io/docs/api/quote
// Authentication is sent as X-Finnhub-Token so credentials never enter request URLs or logs.
const FINNHUB_QUOTE_ENDPOINT = 'https://finnhub.io/api/v1/quote';
const DEFAULT_OUTPUT_PATH = resolve('generated/markets.json');
const REQUEST_TIMEOUT_MS = 12_000;
const CONCURRENCY = 3;
const BATCH_DELAY_MS = 500;

export const FinnhubQuoteSchema = z.object({
  c: z.number().finite().positive(),
  d: z.number().finite().optional(),
  dp: z.number().finite().optional(),
  h: z.number().finite().nonnegative().optional(),
  l: z.number().finite().nonnegative().optional(),
  o: z.number().finite().nonnegative().optional(),
  pc: z.number().finite().positive().optional(),
  t: z.number().int().positive().optional(),
}).passthrough();

type MarketErrorCode = MarketSymbolError['code'];

export interface SafeMarketDiagnostic {
  symbol: string;
  code: MarketErrorCode;
  retainedPreviousValue: boolean;
}

export class MarketUpdateError extends Error {
  readonly diagnostics: SafeMarketDiagnostic[];

  constructor(message: string, diagnostics: SafeMarketDiagnostic[] = []) {
    super(message);
    this.name = 'MarketUpdateError';
    this.diagnostics = diagnostics;
  }
}

class FinnhubRequestError extends Error {
  readonly code: MarketErrorCode;

  constructor(code: MarketErrorCode, message: string) {
    super(message);
    this.name = 'FinnhubRequestError';
    this.code = code;
  }
}

export interface GenerateMarketOptions {
  apiKey: string;
  outputPath?: string;
  previousSnapshotPath?: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  force?: boolean;
  batchDelayMs?: number;
  onDiagnostics?: (diagnostics: SafeMarketDiagnostic[]) => void;
}

export type MarketGenerationResult =
  | { status: 'updated'; snapshot: MarketSnapshot }
  | { status: 'skipped'; snapshot?: MarketSnapshot; reason: string };

export function estimateMarketSession(now = new Date()): MarketSession {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const weekday = parts.find((part) => part.type === 'weekday')?.value;
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value);
    if (!weekday || !Number.isInteger(hour) || !Number.isInteger(minute)) return 'unknown';
    if (weekday === 'Sat' || weekday === 'Sun') return 'closed';
    const totalMinutes = hour * 60 + minute;
    if (totalMinutes >= 4 * 60 && totalMinutes < 9 * 60 + 30) return 'pre-market';
    if (totalMinutes >= 9 * 60 + 30 && totalMinutes < 16 * 60) return 'regular';
    if (totalMinutes >= 16 * 60 && totalMinutes < 20 * 60) return 'after-hours';
    return 'closed';
  } catch {
    return 'unknown';
  }
}

export function shouldRefreshMarketData(
  now: Date,
  previousSnapshot: MarketSnapshot | undefined,
  force = false,
): boolean {
  if (force || !previousSnapshot) return true;
  const session = estimateMarketSession(now);
  if (session === 'pre-market' || session === 'regular' || session === 'after-hours' || session === 'unknown') return true;
  const ageMs = now.getTime() - Date.parse(previousSnapshot.generatedAt);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short',
  }).format(now);
  const maximumClosedAge = weekday === 'Sat' || weekday === 'Sun'
    ? 48 * 60 * 60 * 1_000
    : 24 * 60 * 60 * 1_000;
  return ageMs >= maximumClosedAge;
}

export async function readPreviousMarketSnapshot(path: string): Promise<MarketSnapshot | undefined> {
  try {
    return MarketSnapshotSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  } catch {
    return undefined;
  }
}

export async function generateMarketSnapshot(options: GenerateMarketOptions): Promise<MarketGenerationResult> {
  if (!options.apiKey.trim()) throw new Error('FINNHUB_API_KEY is required');
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT_PATH;
  const previousPath = options.previousSnapshotPath ?? outputPath;
  const previousSnapshot = await readPreviousMarketSnapshot(previousPath);
  const now = options.now ?? new Date();
  if (!shouldRefreshMarketData(now, previousSnapshot, options.force)) {
    return { status: 'skipped', snapshot: previousSnapshot, reason: 'Outside the normal market refresh window' };
  }

  const results: PromiseSettledResult<MarketInstrument>[] = [];
  for (let index = 0; index < MARKET_INSTRUMENTS.length; index += CONCURRENCY) {
    const batch = MARKET_INSTRUMENTS.slice(index, index + CONCURRENCY);
    results.push(...await Promise.allSettled(batch.map((definition) => fetchQuote(
      definition,
      options.apiKey,
      options.fetchImpl ?? fetch,
    ))));
    if (index + CONCURRENCY < MARKET_INSTRUMENTS.length && (options.batchDelayMs ?? BATCH_DELAY_MS) > 0) {
      await delay(options.batchDelayMs ?? BATCH_DELAY_MS);
    }
  }

  const previousBySymbol = new Map(previousSnapshot?.instruments.map((instrument) => [instrument.symbol, instrument]));
  const instruments: MarketInstrument[] = [];
  const errors: MarketSymbolError[] = [];
  results.forEach((result, index) => {
    const definition = MARKET_INSTRUMENTS[index];
    if (result.status === 'fulfilled') {
      instruments.push(result.value);
      return;
    }
    const providerError = result.reason instanceof FinnhubRequestError
      ? result.reason
      : new FinnhubRequestError('unknown', 'Unexpected provider failure');
    const previous = previousBySymbol.get(definition.symbol);
    if (previous) instruments.push({ ...previous, stale: true });
    errors.push({
      symbol: definition.symbol,
      code: providerError.code,
      message: safeErrorMessage(providerError.code),
      retainedPreviousValue: Boolean(previous),
    });
  });

  const successfulCount = results.filter((result) => result.status === 'fulfilled').length;
  const diagnostics = errors.map(({ symbol, code, retainedPreviousValue }) => ({ symbol, code, retainedPreviousValue }));
  if (successfulCount === 0) {
    throw new MarketUpdateError('Every Finnhub quote request failed; the existing snapshot was preserved', diagnostics);
  }
  if (diagnostics.length > 0) options.onDiagnostics?.(diagnostics);

  const orderedInstruments = MARKET_INSTRUMENTS.flatMap((definition) => {
    const instrument = instruments.find((candidate) => candidate.symbol === definition.symbol);
    return instrument ? [instrument] : [];
  });
  const snapshot = MarketSnapshotSchema.parse({
    schemaVersion: 1,
    provider: 'finnhub',
    generatedAt: now.toISOString(),
    marketSession: estimateMarketSession(now),
    freshness: errors.length > 0 ? 'partial' : 'fresh',
    instruments: orderedInstruments,
    errors,
  });
  await writeAtomically(outputPath, snapshot);
  return { status: 'updated', snapshot };
}

async function fetchQuote(
  definition: MarketInstrumentDefinition,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<MarketInstrument> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      const url = new URL(FINNHUB_QUOTE_ENDPOINT);
      url.searchParams.set('symbol', definition.symbol);
      response = await fetchImpl(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'X-Finnhub-Token': apiKey },
      });
    } catch {
      throw new FinnhubRequestError('network', controller.signal.aborted ? 'Request timed out' : 'Network request failed');
    }
    if (response.status === 429) throw new FinnhubRequestError('rate-limit', 'Provider rate limit exceeded');
    if (!response.ok) throw new FinnhubRequestError('provider-error', `Provider returned HTTP ${response.status}`);

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new FinnhubRequestError('invalid-response', 'Provider response was not valid JSON');
    }
    if (isProviderErrorPayload(raw)) throw new FinnhubRequestError('provider-error', 'Provider returned an error payload');
    if (isEmptyRecord(raw)) throw new FinnhubRequestError('missing-data', 'Provider returned an empty quote');
    const parsed = FinnhubQuoteSchema.safeParse(raw);
    if (!parsed.success) {
      const record = isRecord(raw) ? raw : undefined;
      const currentPrice = record?.c;
      const code: MarketErrorCode = currentPrice === 0 || currentPrice === undefined ? 'missing-data' : 'invalid-response';
      throw new FinnhubRequestError(code, 'Provider quote failed validation');
    }
    const quote = parsed.data;
    return {
      symbol: definition.symbol,
      name: definition.name,
      type: definition.type,
      ...(definition.proxyFor ? { proxyFor: definition.proxyFor } : {}),
      price: quote.c,
      previousClose: quote.pc ?? null,
      change: quote.d ?? null,
      changePercent: quote.dp ?? null,
      providerTimestamp: quote.t ? new Date(quote.t * 1_000).toISOString() : null,
      stale: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function writeAtomically(outputPath: string, snapshot: MarketSnapshot): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, { encoding: 'utf8', mode: 0o644 });
    MarketSnapshotSchema.parse(JSON.parse(await readFile(temporaryPath, 'utf8')));
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyRecord(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length === 0;
}

function isProviderErrorPayload(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return typeof value.error === 'string' || (typeof value.message === 'string' && value.c === undefined);
}

function safeErrorMessage(code: MarketErrorCode): string {
  const messages: Record<MarketErrorCode, string> = {
    network: 'The quote request could not reach the provider.',
    'rate-limit': 'The provider rate limit was reached.',
    'invalid-response': 'The provider returned an invalid quote.',
    'missing-data': 'No valid quote was available for this symbol.',
    'provider-error': 'The provider rejected the quote request.',
    unknown: 'The quote request failed unexpectedly.',
  };
  return messages[code];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function main(): Promise<void> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY is required');
  const force = process.env.FORCE_MARKET_REFRESH === 'true';
  const result = await generateMarketSnapshot({
    apiKey,
    force,
    onDiagnostics: (diagnostics) => diagnostics.forEach((item) => {
      console.warn(`- ${item.symbol}: ${item.code}${item.retainedPreviousValue ? ' (previous value retained)' : ''}`);
    }),
  });
  if (result.status === 'skipped') {
    console.log(`Market update skipped: ${result.reason}.`);
    return;
  }
  const successful = MARKET_INSTRUMENTS.length - result.snapshot.errors.length;
  console.log(`Market snapshot updated: ${successful}/${MARKET_INSTRUMENTS.length} symbols succeeded.`);
  console.log(`Generated at ${result.snapshot.generatedAt}; estimated session ${result.snapshot.marketSession}.`);
  console.log(`Output: ${DEFAULT_OUTPUT_PATH}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    if (error instanceof Error && error.message === 'FINNHUB_API_KEY is required') {
      console.error(error.message);
    } else {
      console.error('Market snapshot update failed. The previous valid snapshot, if present, was preserved.');
      if (error instanceof MarketUpdateError) {
        error.diagnostics.forEach((item) => console.error(`- ${item.symbol}: ${item.code}`));
      }
    }
    process.exitCode = 1;
  });
}
