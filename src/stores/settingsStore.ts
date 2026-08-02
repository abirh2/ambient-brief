import { create } from 'zustand';
import type { AppSettings } from '../types';
import { migrateSettings } from './settingsMigration';
import { DEFAULT_LOCATION, DEFAULT_SETTINGS } from './settingsDefaults';

export { DEFAULT_LOCATION, DEFAULT_SETTINGS };

interface SettingsStoreState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings> | ((previous: AppSettings) => Partial<AppSettings>)) => void;
  resetSettings: () => void;
  toggleDevWidthIndicator: () => void;
}

export const SETTINGS_STORAGE_KEY = 'ambient_brief_settings_v1';

function restoreSettings(): AppSettings {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const migrated = migrateSettings(JSON.parse(saved));
    if (migrated) {
      return { ...migrated, isDemoMode: import.meta.env.DEV && migrated.isDemoMode };
    }
    console.warn('Stored settings failed validation, falling back to defaults.');
  } catch (error) {
    console.warn('Error reading settings from localStorage', error);
  }
  return DEFAULT_SETTINGS;
}

function persist(settings: AppSettings): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: restoreSettings(),
  updateSettings: (partial) => set((state) => {
    const patch = typeof partial === 'function' ? partial(state.settings) : partial;
    const updated = migrateSettings({
      ...state.settings,
      ...patch,
      isDemoMode: import.meta.env.DEV && patch.isDemoMode === true,
    });
    if (!updated) return state;
    persist(updated);
    return { settings: updated };
  }),
  resetSettings: () => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear settings in localStorage:', error);
    }
    set({ settings: DEFAULT_SETTINGS });
  },
  toggleDevWidthIndicator: () => set((state) => {
    const updated = { ...state.settings, showDevWidthIndicator: !state.settings.showDevWidthIndicator };
    persist(updated);
    return { settings: updated };
  }),
}));
