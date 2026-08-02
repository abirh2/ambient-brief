import { create } from 'zustand';
import { ExchangeRate } from '../types';
import { cacheService } from '../api/cacheService';
import { useDiagnosticsStore } from '../api/diagnosticsStore';

interface CurrencyStoreState {
  currencies: Record<string, string>;
  currenciesLoading: boolean;
  currenciesError: string | null;
  rate: ExchangeRate | null;
  rateLoading: boolean;
  rateError: string | null;
  isStale: boolean;
  
  fetchCurrencies: () => Promise<Record<string, string>>;
  fetchExchangeRate: (base: string, quote: string, force?: boolean) => Promise<void>;
}

const CURRENCIES_CACHE_KEY = 'currency_list_v1';
const RATE_CACHE_PREFIX = 'exchange_rate_v1_';

export const useCurrencyStore = create<CurrencyStoreState>((set) => ({
  currencies: {},
  currenciesLoading: false,
  currenciesError: null,
  rate: null,
  rateLoading: false,
  rateError: null,
  isStale: false,

  fetchCurrencies: async () => {
    // Check cache
    const cached = cacheService.getCache<Record<string, string>>(CURRENCIES_CACHE_KEY);
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
      const res = await fetch('https://api.frankfurter.dev/v1/currencies');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json() as Record<string, string>;

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
      
      const fallback = cacheService.getCache<Record<string, string>>(CURRENCIES_CACHE_KEY);
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

  fetchExchangeRate: async (base: string, quote: string, force = false) => {
    if (!base || !quote) return;
    if (base === quote) {
      set({ rate: null, rateError: 'Base and quote currencies cannot be the same', rateLoading: false, isStale: false });
      return;
    }

    const cacheKey = `${RATE_CACHE_PREFIX}${base}_${quote}`;
    const cached = cacheService.getCache<ExchangeRate>(cacheKey);

    // If cache is fresh and not forced, use it immediately
    if (cached && !cached.isStale && !force) {
      set({ rate: cached.data, rateError: null, rateLoading: false, isStale: false });
      return;
    }

    // If cache is stale, use it as fallback state while fetching
    if (cached && !force) {
      set({ rate: cached.data, rateError: null, rateLoading: false, isStale: true });
    } else {
      set({ rateLoading: true, rateError: null });
    }

    const updateDiagnostic = useDiagnosticsStore.getState().updateDiagnostic;
    updateDiagnostic('currency', { status: 'loading' });

    try {
      // Fetch rates
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?from=${base}&to=${quote}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Currency unavailable');
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json() as {
        amount: number;
        base: string;
        date: string;
        rates: Record<string, number>;
      };

      const rateVal = json.rates?.[quote];
      if (rateVal === undefined) {
        throw new Error('Currency unavailable');
      }

      const newRate: ExchangeRate = {
        base,
        quote,
        rate: rateVal,
        date: json.date,
        fetchedAt: new Date().toISOString(),
      };

      // Cache for 12 hours
      cacheService.setCache(cacheKey, newRate, 12 * 60 * 60 * 1000);
      set({ rate: newRate, rateError: null, rateLoading: false, isStale: false });
      updateDiagnostic('currency', { status: 'idle', errorMessage: undefined });
    } catch (err) {
      console.warn(`Failed to fetch exchange rate for ${base}/${quote}:`, err);
      const errMsg = 'Currency unavailable';

      // Fallback to cache even if stale on request failure
      const fallback = cacheService.getCache<ExchangeRate>(cacheKey);
      if (fallback && fallback.data) {
        set({ rate: fallback.data, rateError: null, rateLoading: false, isStale: true });
        updateDiagnostic('currency', { status: 'idle', errorMessage: undefined });
      } else {
        set({ rate: null, rateError: errMsg, rateLoading: false, isStale: false });
        updateDiagnostic('currency', { status: 'error', errorMessage: errMsg });
      }
    }
  }
}));
