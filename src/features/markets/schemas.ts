import { z } from 'zod';

export const MarketInstrumentSchema = z.object({
  symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,14}$/),
  name: z.string().min(1),
  type: z.enum(['etf-proxy', 'company']),
  proxyFor: z.string().min(1).optional(),
  price: z.number().finite().positive(),
  previousClose: z.number().finite().positive().nullable(),
  change: z.number().finite().nullable(),
  changePercent: z.number().finite().nullable(),
  providerTimestamp: z.iso.datetime().nullable(),
  stale: z.boolean(),
}).strict().superRefine((instrument, context) => {
  if (instrument.type === 'etf-proxy' && !instrument.proxyFor) {
    context.addIssue({ code: 'custom', path: ['proxyFor'], message: 'ETF proxies must identify the represented index' });
  }
  if (instrument.type === 'company' && instrument.proxyFor !== undefined) {
    context.addIssue({ code: 'custom', path: ['proxyFor'], message: 'Companies cannot proxy an index' });
  }
});

export const MarketSymbolErrorSchema = z.object({
  symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,14}$/),
  code: z.enum(['network', 'rate-limit', 'invalid-response', 'missing-data', 'provider-error', 'unknown']),
  message: z.string().min(1).max(200),
  retainedPreviousValue: z.boolean(),
}).strict();

export const MarketSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  provider: z.literal('finnhub'),
  generatedAt: z.iso.datetime(),
  marketSession: z.enum(['pre-market', 'regular', 'after-hours', 'closed', 'unknown']),
  freshness: z.enum(['fresh', 'cached', 'stale', 'partial']),
  instruments: z.array(MarketInstrumentSchema).max(64),
  errors: z.array(MarketSymbolErrorSchema).max(64),
}).strict().superRefine((snapshot, context) => {
  const symbols = snapshot.instruments.map((instrument) => instrument.symbol);
  if (new Set(symbols).size !== symbols.length) {
    context.addIssue({ code: 'custom', path: ['instruments'], message: 'Instrument symbols must be unique' });
  }
  if (snapshot.freshness === 'fresh' && (snapshot.errors.length > 0 || snapshot.instruments.some((item) => item.stale))) {
    context.addIssue({ code: 'custom', path: ['freshness'], message: 'Fresh snapshots cannot contain errors or stale values' });
  }
  if (snapshot.freshness === 'partial' && snapshot.errors.length === 0) {
    context.addIssue({ code: 'custom', path: ['freshness'], message: 'Partial snapshots must explain at least one symbol error' });
  }
});

export type ValidatedMarketSnapshot = z.infer<typeof MarketSnapshotSchema>;
