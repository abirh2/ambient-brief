import { create } from 'zustand';
import {
  WeatherStateStatus,
  NewsStateStatus,
  MarketStateStatus,
  AlertSeverity,
  TimeOfDayVariant,
  WeatherEffectVariant,
} from '../types';

interface DevStateStore {
  weatherStatus: WeatherStateStatus;
  newsStatus: NewsStateStatus;
  marketStatus: MarketStateStatus;
  weatherAlertVisible: boolean;
  weatherAlertSeverity: AlertSeverity;
  bgTimeOfDayOverride: 'auto' | TimeOfDayVariant;
  bgWeatherOverride: 'auto' | WeatherEffectVariant;
  setWeatherStatus: (status: WeatherStateStatus) => void;
  setNewsStatus: (status: NewsStateStatus) => void;
  setMarketStatus: (status: MarketStateStatus) => void;
  dismissWeatherAlert: () => void;
  restoreWeatherAlert: () => void;
  setWeatherAlertSeverity: (severity: AlertSeverity) => void;
  setBgTimeOfDayOverride: (override: 'auto' | TimeOfDayVariant) => void;
  setBgWeatherOverride: (override: 'auto' | WeatherEffectVariant) => void;
  setAllPreset: (preset: 'loaded' | 'loading' | 'error_unavailable' | 'cached') => void;
}

export const useDevStateStore = create<DevStateStore>((set) => ({
  weatherStatus: 'loaded',
  newsStatus: 'loaded',
  marketStatus: 'loaded',
  weatherAlertVisible: true,
  weatherAlertSeverity: 'warning',
  bgTimeOfDayOverride: 'auto',
  bgWeatherOverride: 'auto',

  setWeatherStatus: (weatherStatus) => set({ weatherStatus }),
  setNewsStatus: (newsStatus) => set({ newsStatus }),
  setMarketStatus: (marketStatus) => set({ marketStatus }),
  dismissWeatherAlert: () => set({ weatherAlertVisible: false }),
  restoreWeatherAlert: () => set({ weatherAlertVisible: true }),
  setWeatherAlertSeverity: (severity) =>
    set({ weatherAlertSeverity: severity, weatherAlertVisible: true }),
  setBgTimeOfDayOverride: (bgTimeOfDayOverride) => set({ bgTimeOfDayOverride }),
  setBgWeatherOverride: (bgWeatherOverride) => set({ bgWeatherOverride }),

  setAllPreset: (preset) => {
    if (preset === 'loaded') {
      set({
        weatherStatus: 'loaded',
        newsStatus: 'loaded',
        marketStatus: 'loaded',
        weatherAlertVisible: true,
      });
    } else if (preset === 'loading') {
      set({
        weatherStatus: 'loading',
        newsStatus: 'loading',
        marketStatus: 'loading',
      });
    } else if (preset === 'error_unavailable') {
      set({
        weatherStatus: 'permission_denied',
        newsStatus: 'error',
        marketStatus: 'unavailable',
      });
    } else if (preset === 'cached') {
      set({
        weatherStatus: 'cached',
        newsStatus: 'cached',
        marketStatus: 'cached',
        weatherAlertVisible: true,
      });
    }
  },
}));
