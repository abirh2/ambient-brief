import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProviderSettingsSection } from '../../../../components/settings/SettingsSections';
import { MARKET_INSTRUMENTS } from '../../instruments';
import type { MarketState } from '../../model';
import { MarketSnapshotSchema } from '../../schemas';
import { MarketPanel } from '../MarketPanel';

function loadedState(): MarketState {
  return {
    status: 'partial',
    browserFetchedAt: '2026-08-05T20:01:00.000Z',
    snapshot: MarketSnapshotSchema.parse({
      schemaVersion: 1, provider: 'finnhub', generatedAt: '2026-08-05T20:00:00.000Z', marketSession: 'regular', freshness: 'partial',
      instruments: MARKET_INSTRUMENTS.map((definition, index) => ({
        symbol: definition.symbol, name: definition.name, type: definition.type,
        ...(definition.proxyFor ? { proxyFor: definition.proxyFor } : {}),
        price: 100 + index, previousClose: 100, change: index - 3, changePercent: index - 3,
        providerTimestamp: '2026-08-05T20:00:00.000Z', stale: definition.symbol === 'META',
      })),
      errors: [{ symbol: 'META', code: 'network', message: 'The quote request could not reach the provider.', retainedPreviousValue: true }],
    }),
  };
}

describe('MarketPanel', () => {
  it('renders honest proxy labels, all selected companies, directions, and partial state', () => {
    const html = renderToStaticMarkup(<MarketPanel state={loadedState()} onRefresh={() => undefined} />);
    expect(html).toContain('S&amp;P 500');
    expect(html).toContain('SPY fund');
    expect(html).toContain('Dow Jones');
    expect(html).toContain('DIA fund');
    expect(html).toContain('Nasdaq-100');
    expect(html).toContain('QQQ fund');
    expect(html).toContain('Apple');
    expect(html).toContain('Meta');
    expect(html).toContain('Some quotes are unavailable');
    expect(html).toContain('Previous snapshot');
    expect(html).not.toContain('Live');
  });

  it('renders a compact first-run unavailable state', () => {
    const html = renderToStaticMarkup(<MarketPanel state={{ status: 'unavailable', message: 'Not generated yet.' }} onRefresh={() => undefined} />);
    expect(html).toContain('Market snapshot unavailable');
    expect(html).toContain('Not generated yet.');
  });

  it('keeps provider settings read-only and contains no browser API-key control', () => {
    const html = renderToStaticMarkup(<ProviderSettingsSection marketState={loadedState()} onRefreshMarkets={() => undefined} onClearMarketCache={() => undefined} />);
    expect(html).toContain('Finnhub');
    expect(html).toContain('private repository secret');
    expect(html).not.toContain('API Key');
    expect(html).not.toContain('password');
  });
});
