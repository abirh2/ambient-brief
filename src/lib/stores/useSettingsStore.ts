import { create } from 'zustand';
import { AppSettings, AppLocation } from '../types';
import { AppSettingsSchema } from '../validation/schemas';

export const DEFAULT_LOCATION: AppLocation = {
  id: 'upper-darby-pa-us',
  name: 'Upper Darby',
  admin1: 'Pennsylvania',
  country: 'United States',
  countryCode: 'US',
  latitude: 39.9601,
  longitude: -75.2638,
  timezone: 'America/New_York',
  source: 'saved',
};

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  useCurrentLocation: true,
  savedLocation: 'Upper Darby, PA',
  activeLocation: DEFAULT_LOCATION,
  temperatureUnit: 'fahrenheit',
  timeFormat: '12h',
  newsCategories: ['Top', 'U.S.', 'Technology'],
  showMarkets: true,
  marketSymbols: ['SPY', 'DIA', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'],
  showSparklines: true,
  backgroundMotion: 'subtle',
  glassIntensity: 0.65,
  contentDensity: 'comfortable',
  reducedMotion: false,
  currencyEnabled: true,
  currencyPair: 'USD/BDT',
  islamic: {
    enabled: false,
    showNextPrayer: true,
    showHijriDate: true,
    showFullSchedule: false,
    calculationMethod: 'ISNA',
    asrMethod: 'Hanafi',
  },
  showDevWidthIndicator: true,
  alphaVantageApiKey: '',
  guardianApiKey: '',
  isDemoMode: false,
};

interface SettingsStoreState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings> | ((prev: AppSettings) => Partial<AppSettings>)) => void;
  resetSettings: () => void;
  toggleDevWidthIndicator: () => void;
}

const STORAGE_KEY = 'ambient_brief_settings_v1';

const loadInitialSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const validated = AppSettingsSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data as AppSettings;
      } else {
        console.warn('Stored settings failed validation, falling back to defaults.', validated.error);
      }
    }
  } catch (err) {
    console.warn('Error reading settings from localStorage', err);
  }
  return DEFAULT_SETTINGS;
};

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: loadInitialSettings(),

  updateSettings: (partial) => {
    set((state) => {
      const patch = typeof partial === 'function' ? partial(state.settings) : partial;
      const updated = { ...state.settings, ...patch };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save settings to localStorage:', err);
      }

      return { settings: updated };
    });
  },

  resetSettings: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear settings in localStorage:', err);
    }
    set({ settings: DEFAULT_SETTINGS });
  },

  toggleDevWidthIndicator: () => {
    set((state) => {
      const updated = {
        ...state.settings,
        showDevWidthIndicator: !state.settings.showDevWidthIndicator,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save dev width indicator setting:', err);
      }
      return { settings: updated };
    });
  },
}));
