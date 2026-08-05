export type RefreshProviderId =
  | 'weather'
  | 'airQuality'
  | 'alerts'
  | 'prayerTimes'
  | 'currency'
  | 'news';

export type RefreshCause = 'initial' | 'routine' | 'visible' | 'online' | 'settings' | 'manual';
export type ProviderRefreshResult = 'success' | 'cached' | 'skipped';

export interface RefreshProvider {
  id: RefreshProviderId;
  enabled: () => boolean;
  isStale: () => boolean;
  refresh: (options: { force: boolean; signal: AbortSignal; cause: RefreshCause }) => Promise<ProviderRefreshResult>;
}

export interface RefreshSummary {
  cause: RefreshCause;
  succeeded: RefreshProviderId[];
  cached: RefreshProviderId[];
  failed: RefreshProviderId[];
  skipped: RefreshProviderId[];
}

export interface RefreshCoordinatorOptions {
  providers: RefreshProvider[];
  isOnline?: () => boolean;
  isHidden?: () => boolean;
  routineIntervalMs?: number;
  setInterval?: (callback: () => void, intervalMs: number) => ReturnType<typeof globalThis.setInterval>;
  clearInterval?: (timer: ReturnType<typeof globalThis.setInterval>) => void;
}

const DEFAULT_ROUTINE_INTERVAL_MS = 60_000;

/**
 * Owns every provider refresh. The coordinator deliberately runs providers in
 * sequence so a page load or reconnect cannot create a request burst.
 */
export class RefreshCoordinator {
  private readonly providers: RefreshProvider[];
  private readonly providersById: Map<RefreshProviderId, RefreshProvider>;
  private readonly isOnline: () => boolean;
  private readonly isHidden: () => boolean;
  private readonly routineIntervalMs: number;
  private readonly createInterval: NonNullable<RefreshCoordinatorOptions['setInterval']>;
  private readonly destroyInterval: NonNullable<RefreshCoordinatorOptions['clearInterval']>;
  private readonly inFlight = new Map<RefreshProviderId, Promise<ProviderRefreshResult>>();
  private readonly abortControllers = new Map<RefreshProviderId, AbortController>();
  private timer: ReturnType<typeof globalThis.setInterval> | null = null;
  private stopped = false;

  constructor(options: RefreshCoordinatorOptions) {
    this.providers = options.providers;
    this.providersById = new Map(options.providers.map((provider) => [provider.id, provider]));
    this.isOnline = options.isOnline ?? (() => typeof navigator === 'undefined' || navigator.onLine !== false);
    this.isHidden = options.isHidden ?? (() => typeof document !== 'undefined' && document.hidden);
    this.routineIntervalMs = options.routineIntervalMs ?? DEFAULT_ROUTINE_INTERVAL_MS;
    this.createInterval = options.setInterval ?? globalThis.setInterval;
    this.destroyInterval = options.clearInterval ?? globalThis.clearInterval;
  }

  async start(): Promise<RefreshSummary> {
    this.stopped = false;
    if (!this.timer) {
      this.timer = this.createInterval(() => void this.refreshStale('routine'), this.routineIntervalMs);
    }
    return this.run(this.providers, 'initial', false, false);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) this.destroyInterval(this.timer);
    this.timer = null;
    this.abortAll();
  }

  handleOffline(): void {
    this.abortAll();
  }

  async handleOnline(): Promise<RefreshSummary> {
    return this.refreshStale('online');
  }

  async handleVisibilityChange(): Promise<RefreshSummary | null> {
    if (this.isHidden()) return null;
    return this.refreshStale('visible');
  }

  async refreshStale(cause: 'routine' | 'visible' | 'online'): Promise<RefreshSummary> {
    if (this.isHidden()) return emptySummary(cause, this.enabledProviderIds());
    return this.run(this.providers, cause, false, true);
  }

  async manualRefresh(): Promise<RefreshSummary> {
    return this.run(this.providers, 'manual', true, false);
  }

  async settingsChanged(providerIds: RefreshProviderId[]): Promise<RefreshSummary> {
    this.abort(providerIds);
    const providers = providerIds
      .map((id) => this.providersById.get(id))
      .filter((provider): provider is RefreshProvider => Boolean(provider));
    return this.run(providers, 'settings', false, false);
  }

  private async run(
    providers: RefreshProvider[],
    cause: RefreshCause,
    force: boolean,
    staleOnly: boolean,
  ): Promise<RefreshSummary> {
    const summary: RefreshSummary = { cause, succeeded: [], cached: [], failed: [], skipped: [] };
    for (const provider of providers) {
      if (this.stopped || !provider.enabled() || (staleOnly && !provider.isStale())) {
        summary.skipped.push(provider.id);
        continue;
      }
      if (!this.isOnline()) {
        summary.skipped.push(provider.id);
        continue;
      }
      try {
        const result = await this.runProvider(provider, force, cause);
        if (result === 'success') summary.succeeded.push(provider.id);
        else if (result === 'cached') summary.cached.push(provider.id);
        else summary.skipped.push(provider.id);
      } catch (error: unknown) {
        if (isAbortError(error)) summary.skipped.push(provider.id);
        else summary.failed.push(provider.id);
      }
    }
    return summary;
  }

  private runProvider(provider: RefreshProvider, force: boolean, cause: RefreshCause): Promise<ProviderRefreshResult> {
    const existing = this.inFlight.get(provider.id);
    if (existing) return existing;

    const controller = new AbortController();
    this.abortControllers.set(provider.id, controller);
    const request = provider.refresh({ force, signal: controller.signal, cause });
    this.inFlight.set(provider.id, request);
    void request.finally(() => {
      if (this.inFlight.get(provider.id) === request) this.inFlight.delete(provider.id);
      if (this.abortControllers.get(provider.id) === controller) this.abortControllers.delete(provider.id);
    }).catch(() => undefined);
    return request;
  }

  private abort(providerIds: RefreshProviderId[]): void {
    providerIds.forEach((id) => {
      this.abortControllers.get(id)?.abort();
      this.abortControllers.delete(id);
      this.inFlight.delete(id);
    });
  }

  private abortAll(): void {
    this.abort([...this.abortControllers.keys()]);
  }

  private enabledProviderIds(): RefreshProviderId[] {
    return this.providers.filter((provider) => provider.enabled()).map((provider) => provider.id);
  }
}

function emptySummary(cause: RefreshCause, skipped: RefreshProviderId[]): RefreshSummary {
  return { cause, succeeded: [], cached: [], failed: [], skipped };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
