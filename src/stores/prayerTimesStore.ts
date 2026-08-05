import { create } from 'zustand';
import { DailyPrayerSchedule } from '../types';
import {
  fetchScheduleForDate,
  getLocalDateComponents,
  ALADHAN_CALCULATION_METHODS,
  ALADHAN_ASR_METHODS,
  deserializeSchedule,
} from '../features/prayer-times/service';
import { useSettingsStore } from './settingsStore';
import { useDiagnosticsStore } from '../lib/api/diagnosticsStore';
import { cacheService } from '../lib/api/cacheService';
import { ProviderDiagnostic } from '../lib/api/types';
import { calculateNextPrayer, type NextPrayerInfo } from '../features/prayer-times/calculation';

const LAST_VALID_TODAY_KEY = 'ambient_brief_last_valid_today_v1';
const LAST_VALID_TOMORROW_KEY = 'ambient_brief_last_valid_tomorrow_v1';

function loadCachedSchedule(key: string): DailyPrayerSchedule | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return deserializeSchedule(JSON.parse(raw));
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

interface IslamicStoreState {
  todaySchedule: DailyPrayerSchedule | null;
  tomorrowSchedule: DailyPrayerSchedule | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  nextPrayer: NextPrayerInfo | null;

  fetchSchedules: (lat: number, lng: number, method: string, school: string, force?: boolean, signal?: AbortSignal) => Promise<'success' | 'cached' | false>;
  updateCountdown: () => void;
}

export const useIslamicStore = create<IslamicStoreState>((set, get) => ({
  todaySchedule: loadCachedSchedule(LAST_VALID_TODAY_KEY),
  tomorrowSchedule: loadCachedSchedule(LAST_VALID_TOMORROW_KEY),
  loading: false,
  error: null,
  isStale: false,
  nextPrayer: null,

  fetchSchedules: async (lat, lng, method, school, force = false, signal) => {
    const startTime = Date.now();
    const updateDiag = (
      status: ProviderDiagnostic['status'],
      extra: Partial<ProviderDiagnostic> = {},
    ) => {
      try {
        useDiagnosticsStore.getState().updateDiagnostic('prayerTimes', {
          status,
          responseTimeMs: Date.now() - startTime,
          ...(status === 'success' ? { lastFetchedAt: new Date().toISOString() } : {}),
          ...extra,
        });
      } catch {
        // Ignore
      }
    };

    set({ loading: true, error: null });
    updateDiag('loading');

    const timezone = useSettingsStore.getState().settings.activeLocation?.timezone || 'UTC';
    const todayComps = getLocalDateComponents(timezone, new Date());
    const todayStr = `${String(todayComps.day).padStart(2, '0')}-${String(todayComps.month).padStart(2, '0')}-${todayComps.year}`;

    const tomorrowComps = addCalendarDays(todayComps, 1);
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
        fetchScheduleForDate(lat, lng, todayStr, method, school, signal),
        fetchScheduleForDate(lat, lng, tomorrowStr, method, school, signal),
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
      return 'success';
    } catch (err: unknown) {
      if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
        set({ loading: false });
        throw err;
      }
      console.warn('[IslamicStore] Failed to fetch live prayer schedules, falling back to cache:', err);
      const errorMessage = err instanceof Error ? err.message : 'Prayer times unavailable.';

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

        updateDiag('error', {
          cacheSource: 'cache',
          isStale,
          errorMessage,
        });
        return 'cached';
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
          errorMessage,
        });
        return false;
      }
    }
  },

  updateCountdown: () => {
    const { todaySchedule, tomorrowSchedule } = get();
    set({ nextPrayer: calculateNextPrayer(todaySchedule, tomorrowSchedule) });
  },
}));

function addCalendarDays(
  value: ReturnType<typeof getLocalDateComponents>,
  days: number,
): ReturnType<typeof getLocalDateComponents> {
  const date = new Date(Date.UTC(value.year, value.month - 1, value.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: value.hour,
    minute: value.minute,
    second: value.second,
  };
}
