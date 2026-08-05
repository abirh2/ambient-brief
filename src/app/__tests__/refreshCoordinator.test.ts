import { describe, expect, it, vi } from 'vitest';
import {
  RefreshCoordinator,
  type ProviderRefreshResult,
  type RefreshProvider,
  type RefreshProviderId,
} from '../refreshCoordinator';

const ORDER: RefreshProviderId[] = ['weather', 'airQuality', 'alerts', 'prayerTimes', 'currency', 'news'];

function makeHarness(options: {
  online?: boolean;
  hidden?: boolean;
  stale?: Partial<Record<RefreshProviderId, boolean>>;
  results?: Partial<Record<RefreshProviderId, ProviderRefreshResult | Error>>;
} = {}) {
  const calls: RefreshProviderId[] = [];
  let online = options.online ?? true;
  let hidden = options.hidden ?? false;
  const stale = Object.fromEntries(ORDER.map((id) => [id, options.stale?.[id] ?? true])) as Record<RefreshProviderId, boolean>;
  const providers: RefreshProvider[] = ORDER.map((id) => ({
    id,
    enabled: () => true,
    isStale: () => stale[id],
    refresh: async () => {
      calls.push(id);
      const result = options.results?.[id];
      if (result instanceof Error) throw result;
      return result ?? 'success';
    },
  }));
  const coordinator = new RefreshCoordinator({
    providers,
    isOnline: () => online,
    isHidden: () => hidden,
    setInterval: () => 1 as unknown as ReturnType<typeof globalThis.setInterval>,
    clearInterval: () => undefined,
  });
  return {
    calls,
    coordinator,
    providers,
    stale,
    setOnline: (value: boolean) => { online = value; },
    setHidden: (value: boolean) => { hidden = value; },
  };
}

describe('RefreshCoordinator', () => {
  it('cold start refreshes providers sequentially in the required order', async () => {
    const harness = makeHarness();
    const summary = await harness.coordinator.start();
    expect(harness.calls).toEqual(ORDER);
    expect(summary.succeeded).toEqual(ORDER);
  });

  it('warm cache is revalidated in order without a simultaneous request burst', async () => {
    const resolvers: Array<() => void> = [];
    let active = 0;
    let peakActive = 0;
    const harness = makeHarness({ stale: Object.fromEntries(ORDER.map((id) => [id, false])) });
    harness.providers.forEach((provider) => {
      provider.refresh = () => new Promise((resolve) => {
        active += 1;
        peakActive = Math.max(peakActive, active);
        resolvers.push(() => {
          active -= 1;
          resolve('success');
        });
      });
    });
    const started = harness.coordinator.start();
    for (let index = 0; index < ORDER.length; index += 1) {
      await vi.waitFor(() => expect(resolvers).toHaveLength(index + 1));
      resolvers[index]();
    }
    await started;
    expect(peakActive).toBe(1);
  });

  it('offline start does not issue or retry requests', async () => {
    const harness = makeHarness({ online: false });
    const summary = await harness.coordinator.start();
    await harness.coordinator.refreshStale('routine');
    expect(harness.calls).toEqual([]);
    expect(summary.skipped).toEqual(ORDER);
  });

  it('reconnect refreshes only stale providers', async () => {
    const harness = makeHarness({ online: false, stale: { weather: true, news: true, currency: false } });
    ORDER.filter((id) => id !== 'weather' && id !== 'news').forEach((id) => { harness.stale[id] = false; });
    await harness.coordinator.start();
    harness.setOnline(true);
    await harness.coordinator.handleOnline();
    expect(harness.calls).toEqual(['weather', 'news']);
  });

  it('hidden tab suppresses routine work and refreshes stale data when visible', async () => {
    const harness = makeHarness({ hidden: true });
    await harness.coordinator.refreshStale('routine');
    expect(harness.calls).toEqual([]);
    harness.setHidden(false);
    await harness.coordinator.handleVisibilityChange();
    expect(harness.calls).toEqual(ORDER);
  });

  it('location change aborts obsolete work and excludes location-independent providers', async () => {
    const harness = makeHarness();
    await harness.coordinator.settingsChanged(['weather', 'airQuality', 'alerts', 'prayerTimes']);
    expect(harness.calls).toEqual(['weather', 'airQuality', 'alerts', 'prayerTimes']);
    expect(harness.calls).not.toContain('currency');
    expect(harness.calls).not.toContain('news');
  });

  it('rapid category changes abort the obsolete news request', async () => {
    let firstSignal: AbortSignal | undefined;
    let requestNumber = 0;
    const news: RefreshProvider = {
      id: 'news', enabled: () => true, isStale: () => true,
      refresh: ({ signal }) => {
        requestNumber += 1;
        if (requestNumber === 1) {
          firstSignal = signal;
          return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
        }
        return Promise.resolve('success');
      },
    };
    const coordinator = new RefreshCoordinator({
      providers: [news],
      setInterval: () => 1 as unknown as ReturnType<typeof globalThis.setInterval>,
      clearInterval: () => undefined,
    });
    const first = coordinator.settingsChanged(['news']);
    const second = coordinator.settingsChanged(['news']);
    await Promise.all([first, second]);
    expect(firstSignal?.aborted).toBe(true);
    expect(requestNumber).toBe(2);
  });

  it('isolates provider failures and reports partial manual success', async () => {
    const harness = makeHarness({ results: { airQuality: new Error('AQI down'), currency: 'cached' } });
    const summary = await harness.coordinator.manualRefresh();
    expect(harness.calls).toEqual(ORDER);
    expect(summary.failed).toEqual(['airQuality']);
    expect(summary.cached).toEqual(['currency']);
    expect(summary.succeeded).toEqual(['weather', 'alerts', 'prayerTimes', 'news']);
  });
});
