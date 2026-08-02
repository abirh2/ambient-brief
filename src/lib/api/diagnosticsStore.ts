import { create } from 'zustand';
import { ProviderDiagnostic } from './types';

interface DiagnosticsStore {
  records: Record<string, ProviderDiagnostic>;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  updateDiagnostic: (providerId: string, update: Partial<ProviderDiagnostic>) => void;
  resetAll: () => void;
}

const DEFAULT_PROVIDERS: ProviderDiagnostic[] = [
  { providerId: 'weather', providerName: 'Weather API (Open-Meteo)', status: 'idle' },
  { providerId: 'hourlyForecast', providerName: 'Hourly Forecast Feed', status: 'idle' },
  { providerId: 'weatherAlerts', providerName: 'NWS Severe Weather Alerts', status: 'idle' },
  { providerId: 'news', providerName: 'News Feed (Currents static cache)', status: 'idle' },
  { providerId: 'markets', providerName: 'Financial Markets (TradingView widget)', status: 'idle' },
  { providerId: 'currency', providerName: 'Currency Exchange Rates', status: 'idle' },
  { providerId: 'prayerTimes', providerName: 'Prayer Schedule (Aladhan)', status: 'idle' },
];

const initialRecords = DEFAULT_PROVIDERS.reduce((acc, p) => {
  acc[p.providerId] = p;
  return acc;
}, {} as Record<string, ProviderDiagnostic>);

export const useDiagnosticsStore = create<DiagnosticsStore>((set) => ({
  records: initialRecords,
  isDrawerOpen: false,

  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),

  updateDiagnostic: (providerId, update) =>
    set((state) => ({
      records: {
        ...state.records,
        [providerId]: {
          ...(state.records[providerId] || {
            providerId,
            providerName: providerId,
            status: 'idle',
          }),
          ...update,
        },
      },
    })),

  resetAll: () => set({ records: initialRecords }),
}));
