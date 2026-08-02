import { create } from 'zustand';
import { DailyPrayerSchedule, PrayerName } from '../types';
import {
  fetchScheduleForDate,
  getLocalDateComponents,
  ALADHAN_CALCULATION_METHODS,
  ALADHAN_ASR_METHODS,
} from '../../features/islamic/islamicService';
import { useSettingsStore } from './useSettingsStore';
import { useDiagnosticsStore } from '../api/diagnosticsStore';
import { cacheService } from '../api/cacheService';

const LAST_VALID_TODAY_KEY = 'ambient_brief_last_valid_today_v1';
const LAST_VALID_TOMORROW_KEY = 'ambient_brief_last_valid_tomorrow_v1';

function loadCachedSchedule(key: string): DailyPrayerSchedule | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      prayers: parsed.prayers.map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp),
      })),
    };
  } catch (err) {
    console.warn(`[IslamicStore] Failed to load cached schedule for ${key}:`, err);
    return null;
  }
}

function saveCachedSchedule(key: string, schedule: DailyPrayerSchedule | null) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (schedule) {
      localStorage.setItem(key, JSON.stringify(schedule));
    } else {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[IslamicStore] Failed to save cached schedule for ${key}:`, err);
  }
}

interface NextPrayerInfo {
  name: PrayerName;
  time: string;
  timestamp: Date;
  timeRemainingText: string;
}

interface IslamicStoreState {
  todaySchedule: DailyPrayerSchedule | null;
  tomorrowSchedule: DailyPrayerSchedule | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  nextPrayer: NextPrayerInfo | null;

  fetchSchedules: (lat: number, lng: number, method: string, school: string, force?: boolean) => Promise<void>;
  updateCountdown: () => void;
}

export const useIslamicStore = create<IslamicStoreState>((set, get) => ({
  todaySchedule: loadCachedSchedule(LAST_VALID_TODAY_KEY),
  tomorrowSchedule: loadCachedSchedule(LAST_VALID_TOMORROW_KEY),
  loading: false,
  error: null,
  isStale: false,
  nextPrayer: null,

  fetchSchedules: async (lat, lng, method, school, force = false) => {
    const startTime = Date.now();
    const updateDiag = (status: 'loading' | 'success' | 'error', extra: any = {}) => {
      try {
        useDiagnosticsStore.getState().updateDiagnostic('prayerTimes', {
          status,
          responseTimeMs: Date.now() - startTime,
          lastFetchedAt: new Date().toISOString(),
          ...extra,
        });
      } catch (e) {
        // Ignore
      }
    };

    set({ loading: true, error: null });
    updateDiag('loading');

    const timezone = useSettingsStore.getState().settings.activeLocation?.timezone || 'UTC';
    const todayComps = getLocalDateComponents(timezone, new Date());
    const todayStr = `${String(todayComps.day).padStart(2, '0')}-${String(todayComps.month).padStart(2, '0')}-${todayComps.year}`;

    const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowComps = getLocalDateComponents(timezone, tomorrowDate);
    const tomorrowStr = `${String(tomorrowComps.day).padStart(2, '0')}-${String(tomorrowComps.month).padStart(2, '0')}-${tomorrowComps.year}`;

    try {
      // Clear cache if forced
      if (force) {
        const methodId = ALADHAN_CALCULATION_METHODS[method as keyof typeof ALADHAN_CALCULATION_METHODS]?.id ?? 2;
        const schoolId = ALADHAN_ASR_METHODS[school as keyof typeof ALADHAN_ASR_METHODS]?.id ?? 1;
        cacheService.clearKey(`prayers_${lat.toFixed(3)}_${lng.toFixed(3)}_${todayStr}_${methodId}_${schoolId}`);
        cacheService.clearKey(`prayers_${lat.toFixed(3)}_${lng.toFixed(3)}_${tomorrowStr}_${methodId}_${schoolId}`);
      }

      // Fetch today and tomorrow in parallel
      const [todaySchedule, tomorrowSchedule] = await Promise.all([
        fetchScheduleForDate(lat, lng, todayStr, method, school),
        fetchScheduleForDate(lat, lng, tomorrowStr, method, school),
      ]);

      set({
        todaySchedule,
        tomorrowSchedule,
        loading: false,
        error: null,
        isStale: false,
      });

      // Save to last valid backup keys for fallback
      saveCachedSchedule(LAST_VALID_TODAY_KEY, todaySchedule);
      saveCachedSchedule(LAST_VALID_TOMORROW_KEY, tomorrowSchedule);

      get().updateCountdown();

      updateDiag('success', { cacheSource: force ? 'network' : 'cache' });
    } catch (err: any) {
      console.warn('[IslamicStore] Failed to fetch live prayer schedules, falling back to cache:', err);

      // Fallback behavior: load from cache backup
      const cachedToday = loadCachedSchedule(LAST_VALID_TODAY_KEY);
      const cachedTomorrow = loadCachedSchedule(LAST_VALID_TOMORROW_KEY);

      if (cachedToday) {
        // Mark it stale if its local date no longer matches
        const isStale = cachedToday.gregorianDate !== todayStr;
        set({
          todaySchedule: cachedToday,
          tomorrowSchedule: cachedTomorrow,
          loading: false,
          error: null,
          isStale,
        });

        get().updateCountdown();

        updateDiag('success', {
          isStale,
          errorMessage: err.message || 'Network request failed. Loaded from fallback cache.',
        });
      } else {
        // No valid cached schedule exists
        set({
          todaySchedule: null,
          tomorrowSchedule: null,
          nextPrayer: null,
          loading: false,
          error: 'Prayer times unavailable.',
          isStale: true,
        });

        updateDiag('error', {
          errorMessage: err.message || 'Prayer times unavailable.',
        });
      }
    }
  },

  updateCountdown: () => {
    const { todaySchedule, tomorrowSchedule } = get();
    if (!todaySchedule) {
      set({ nextPrayer: null });
      return;
    }

    const now = new Date();

    // Filter out sunrise from the next prayer candidates
    const todayTargetPrayers = todaySchedule.prayers.filter((p) => p.name !== 'sunrise');

    // Find the first prayer today whose timestamp is in the future
    let next = todayTargetPrayers.find((p) => p.timestamp.getTime() > now.getTime());

    if (!next && tomorrowSchedule) {
      // If no more prayers today, use tomorrow's Fajr
      const tomorrowTargetPrayers = tomorrowSchedule.prayers.filter((p) => p.name !== 'sunrise');
      const tomorrowFajr = tomorrowTargetPrayers.find((p) => p.name === 'fajr');
      if (tomorrowFajr) {
        next = tomorrowFajr;
      }
    }

    if (!next) {
      set({ nextPrayer: null });
      return;
    }

    // Calculate remaining time
    const diffMs = next.timestamp.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    let timeRemainingText = '';
    if (diffMins <= 0) {
      timeRemainingText = 'now';
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (hours > 0) {
        timeRemainingText = `${hours}h ${mins}m`;
      } else {
        timeRemainingText = `${mins}m`;
      }
    }

    set({
      nextPrayer: {
        name: next.name,
        time: next.time,
        timestamp: next.timestamp,
        timeRemainingText,
      },
    });
  },
}));
