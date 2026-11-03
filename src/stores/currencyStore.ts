import { useSettingsStore } from './settingsStore';
import { create } from 'zustand';
import { ExchangeRate } from '../types';
import { cacheService } from '../lib/api/cacheService';
import { useDiagnosticsStore } from '../lib/api/diagnosticsStore';
import { fetchCurrencyList, fetchLatestRate, isValidExchangeRate, normalizeCurrencyList } from '../features/currency/providers/frankfurterProvider';

interface CurrencyStoreState {
  currencies: Record<string, string>;
  currenciesLoading: boolean;
  currenciesError: string | null;
  rate: ExchangeRate | null;
  rateOrigin: 'network' | 'cache' | null;
  rateLoading: boolean;
  rateError: string | null;
  isStale: boolean;
  
  isRateStale: (base: string, quote: string) => boolean;
  fetchCurrencies: () => Promise<Record<string, string>>;
  fetchExchangeRate: (base: string, quote: string, force?: boolean, signal?: AbortSignal) => Promise<'success' | 'cached' | false>;
}

const CURRENCIES_CACHE_KEY = 'currency_list_v1';
const RATE_CACHE_PREFIX = 'exchange_rate_v1_';

let rateGeneration = 0;
function readRate(base: string, quote: string) {
  const key = `${RATE_CACHE_PREFIX}${base}_${quote}`;
  const cached = cacheService.getCache<unknown>(key);
  if (!cached) return null;
  if (!isValidExchangeRate(cached.data, base, quote)) { cacheService.clearKey(key); return null; }
  return { ...cached, data: cached.data };
}

function readCurrencyList() {
  const cached = cacheService.getCache<unknown>(CURRENCIES_CACHE_KEY);
  if (!cached) return null;
  try {
    const data = normalizeCurrencyList(cached.data);
    return Object.keys(data).length ? { ...cached, data } : null;
  } catch { cacheService.clearKey(CURRENCIES_CACHE_KEY); return null; }
}

export const useCurrencyStore = create<CurrencyStoreState>((set, get) => ({
  currencies: {},
  currenciesLoading: false,
  currenciesError: null,
  rate: null,
  rateOrigin: null,
  rateLoading: false,
  rateError: null,
  isStale: false,

  isRateStale: (base, quote) => readRate(base, quote)?.isStale ?? true,

  fetchCurrencies: async () => {
    // Check cache
    const cached = readCurrencyList();
    if (cached && cached.data && Object.keys(cached.data).length > 0) {
      set({ currencies: cached.data });
      if (!cached.isStale) {
        return cached.data;
      }
    }

    set({ currenciesLoading: true, currenciesError: null });
    const updateDiagnostic = useDiagnosticsStore.getState().updateDiagnostic;
    updateDiagnostic('currency', { status: 'loading' });

    try {
      const data = await fetchCurrencyList();

      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        // Cache for 24 hours
        cacheService.setCache(CURRENCIES_CACHE_KEY, data, 24 * 60 * 60 * 1000);
        set({ currencies: data, currenciesLoading: false });
        updateDiagnostic('currency', { status: 'idle', errorMessage: undefined });
        return data;
      } else {
        throw new Error('Invalid currencies format returned');
      }
    } catch (err) {
      console.warn('Failed to fetch currencies list from provider:', err);
      
      const fallback = readCurrencyList();
      if (fallback && fallback.data) {
        set({ currencies: fallback.data, currenciesLoading: false });
        return fallback.data;
      } else {
        set({ currenciesLoading: false, currenciesError: 'Currency list unavailable' });
        updateDiagnostic('currency', { status: 'error', errorMessage: 'Currency list unavailable' });
        return {};
      }
    }
  },

  fetchExchangeRate: async (base: string, quote: string, force = false, signal?: AbortSignal) => {
    const generation = ++rateGeneration;
    const current = () => generation === rateGeneration && !signal?.aborted;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!base || !quote) return false;
    if (base === quote) {
      set({ rate: null, rateError: 'Base and quote currencies cannot be the same', rateLoading: false, isStale: false });
      return false;
    }

    const cacheKey = `${RATE_CACHE_PREFIX}${base}_${quote}`;
    const previous = get().rate;
    const retained = previous && isValidExchangeRate(previous, base, quote) && Date.now() - Date.parse(previous.fetchedAt) <= 36 * 60 * 60_000
      ? { data: previous, fetchedAt: previous.fetchedAt, isStale: Date.now() - Date.parse(previous.fetchedAt) > 12 * 60 * 60_000 } : null;
    const cached = readRate(base, quote) ?? retained;

    // If cache is fresh and not forced, use it immediately
    if (cached && !cached.isStale && !force) {
      set({ rate: cached.data, rateOrigin: 'cache', rateError: null, rateLoading: false, isStale: false });
      return 'cached';
    }

    // If cache is stale, use it as fallback state while fetching
    if (cached && !force) {
      set({ rate: cached.data, rateOrigin: 'cache', rateError: null, rateLoading: false, isStale: true });
    } else {
      set({ rate: cached?.data ?? null, rateLoading: true, rateError: null, isStale: Boolean(cached) });
    }

    const updateDiagnostic = useDiagnosticsStore.getState().updateDiagnostic;
    updateDiagnostic('currency', { status: 'loading' });

    try {
      const newRate = await fetchLatestRate(base, quote, signal);

      if (signal?.aborted) { if (generation === rateGeneration) set({ rateLoading: false }); throw new DOMException('Aborted', 'AbortError'); }
      if (!current()) return false;
      if (!isValidExchangeRate(newRate, base, quote)) throw new Error('Invalid currency response');
      // Cache for 12 hours
      cacheService.setCache(cacheKey, newRate, 12 * 60 * 60 * 1000);
      set({ rate: newRate, rateOrigin: 'network', rateError: null, rateLoading: false, isStale: false });
      updateDiagnostic('currency', { status: 'idle', errorMessage: undefined });
      return 'success';
    } catch (err) {
      if (generation !== rateGeneration) return false;
      if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) { set({ rateLoading: false }); throw err; }
      console.warn(`Failed to fetch exchange rate for ${base}/${quote}:`, err);
      const errMsg = 'Currency unavailable';

      // Fallback to cache even if stale on request failure
      const fallback = readRate(base, quote) ?? retained;
      if (fallback && fallback.data) {
        set({ rate: fallback.data, rateOrigin: 'cache', rateError: null, rateLoading: false, isStale: true });
        updateDiagnostic('currency', { status: 'idle', errorMessage: undefined });
        return 'cached';
      } else {
        set({ rate: null, rateError: errMsg, rateLoading: false, isStale: false });
        updateDiagnostic('currency', { status: 'error', errorMessage: errMsg });
        return false;
      }
    }
  }
}));

useSettingsStore.subscribe((next, previous) => {
  if (next.settings.currencyEnabled !== previous.settings.currencyEnabled || next.settings.currencyPair !== previous.settings.currencyPair) {
    rateGeneration += 1;
    useCurrencyStore.setState({ rate: null, rateLoading: false, rateError: null, isStale: false });
  }
});
