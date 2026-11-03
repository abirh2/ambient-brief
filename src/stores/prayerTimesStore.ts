import { create } from 'zustand';
import { DailyPrayerSchedule } from '../types';
import { fetchScheduleForDate, getLocalDateComponents, ALADHAN_CALCULATION_METHODS, ALADHAN_ASR_METHODS, deserializeSchedule } from '../features/prayer-times/service';
import { useSettingsStore } from './settingsStore';
import { useDiagnosticsStore } from '../lib/api/diagnosticsStore';
import { z } from 'zod';
import { readContextCache } from '../lib/api/contextCache';
import { cacheService } from '../lib/api/cacheService';
import { withRequestDeadline } from '../lib/api/requestDeadline';
import { calculateNextPrayer, type NextPrayerInfo } from '../features/prayer-times/calculation';

export function prayerContextKey(lat: number, lng: number, method: string, school: string, timezone: string) {
  return JSON.stringify([lat, lng, timezone, method, school]);
}
function dateKey(timezone: string, offset = 0) {
  const parts = getLocalDateComponents(timezone);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
  return `${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
}
function backupKey(context: string, date: string) { return `prayer_backup_v2_${context}_${date}`; }
function validSchedule(value: unknown, date: string, method: string, school: string) {
  const schedule = deserializeSchedule(value);
  if (schedule.gregorianDate !== date || schedule.calculationMethod !== method || schedule.asrMethod !== school.toLowerCase()) throw new Error('Mismatched prayer schedule');
  return schedule;
}
function readBackup(context: string, date: string, method: string, school: string) {
  const cached = readContextCache(backupKey(context, date), context, z.unknown());
  if (!cached) return null;
  try {
    const schedule = validSchedule(cached.data, date, method, school);
    return { ...schedule, provenance: { successfulFetchAt: schedule.provenance?.successfulFetchAt ?? cached.fetchedAt, origin: 'cache' as const } };
  }
  catch { cacheService.clearKey(backupKey(context, date)); return null; }
}

interface IslamicStoreState {
  contextKey: string | null;
  todaySchedule: DailyPrayerSchedule | null;
  tomorrowSchedule: DailyPrayerSchedule | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  nextPrayer: NextPrayerInfo | null;
  fetchSchedules: (lat: number, lng: number, method: string, school: string, force?: boolean, signal?: AbortSignal) => Promise<'success' | 'cached' | false>;
  updateCountdown: () => void;
}
let generation = 0;
export const useIslamicStore = create<IslamicStoreState>((set, get) => ({
  contextKey: null, todaySchedule: null, tomorrowSchedule: null, loading: false, error: null, isStale: false, nextPrayer: null,
  fetchSchedules: async (lat, lng, method, school, force = false, signal) => {
    const request = ++generation;
    signal?.throwIfAborted();
    const timezone = useSettingsStore.getState().settings.activeLocation?.timezone || 'UTC';
    const context = prayerContextKey(lat, lng, method, school, timezone);
    const today = dateKey(timezone);
    const tomorrow = dateKey(timezone, 1);
    const current = () => generation === request && !signal?.aborted;
    const previous = get();
    const retained = (schedule: DailyPrayerSchedule | null, date: string) => {
      if (previous.contextKey !== context || !schedule) return null;
      try { return validSchedule(schedule, date, method, school); } catch { return null; }
    };
    const cachedToday = readBackup(context, today, method, school) ?? retained(previous.todaySchedule, today);
    const cachedTomorrow = readBackup(context, tomorrow, method, school) ?? retained(previous.tomorrowSchedule, tomorrow);
    set({ contextKey: context, todaySchedule: cachedToday, tomorrowSchedule: cachedTomorrow, nextPrayer: calculateNextPrayer(cachedToday, cachedTomorrow), loading: true, error: null, isStale: Boolean(cachedToday) });
    const diagnostic = useDiagnosticsStore.getState().updateDiagnostic;
    diagnostic('prayerTimes', { status: 'loading' });
    try {
      if (!(method in ALADHAN_CALCULATION_METHODS) || !(school in ALADHAN_ASR_METHODS)) throw new Error('Unsupported prayer calculation');
      if (force) {
        const methodId = ALADHAN_CALCULATION_METHODS[method as keyof typeof ALADHAN_CALCULATION_METHODS].id;
        const schoolId = ALADHAN_ASR_METHODS[school as keyof typeof ALADHAN_ASR_METHODS].id;
        for (const date of [today, tomorrow]) cacheService.clearKey(`prayers_${lat.toFixed(3)}_${lng.toFixed(3)}_${date}_${methodId}_${schoolId}`);
      }
      const deadlineAt = Date.now() + 15_000;
      const results = await Promise.allSettled([today, tomorrow].map((date) => withRequestDeadline(
        (requestSignal) => fetchScheduleForDate(lat, lng, date, method, school, requestSignal, timezone),
        signal,
        Math.max(1, deadlineAt - Date.now()),
      )));
      if (!current()) throw new DOMException('Aborted', 'AbortError');
      if (dateKey(timezone) !== today) throw new Error('Prayer schedule date changed during request');
      const schedules = results.map((result, index) => {
        if (result.status === 'rejected') return index === 0 ? cachedToday : cachedTomorrow;
        try {
          const schedule = validSchedule(result.value, index === 0 ? today : tomorrow, method, school);
          if (schedule.provenance?.origin !== 'cache') cacheService.setCache(backupKey(context, index === 0 ? today : tomorrow), { contextKey: context, value: schedule }, 24 * 60 * 60_000);
          return schedule;
        } catch { return index === 0 ? cachedToday : cachedTomorrow; }
      });
      const [todaySchedule, tomorrowSchedule] = schedules;
      if (!todaySchedule) throw new Error('Prayer times unavailable');
      const cached = results.some((result) => result.status === 'rejected') || schedules.some((schedule) => schedule?.provenance?.origin === 'cache') || !tomorrowSchedule;
      set({ todaySchedule, tomorrowSchedule, loading: false, error: null, isStale: cached });
      get().updateCountdown();
      diagnostic('prayerTimes', { status: cached ? 'error' : 'success', cacheSource: cached ? 'cache' : 'network', isStale: cached, ...(!cached ? { lastFetchedAt: new Date().toISOString() } : {}) });
      return cached ? 'cached' : 'success';
    } catch (error) {
      if (generation !== request) return false;
      if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) { set({ loading: false }); throw error; }
      const todayFallback = [cachedToday, cachedTomorrow].find((schedule) => schedule?.gregorianDate === dateKey(timezone)) ?? null;
      const tomorrowFallback = [cachedToday, cachedTomorrow].find((schedule) => schedule?.gregorianDate === dateKey(timezone, 1)) ?? null;
      set({ todaySchedule: todayFallback, tomorrowSchedule: tomorrowFallback, loading: false, error: todayFallback ? null : 'Prayer times unavailable.', isStale: true, nextPrayer: calculateNextPrayer(todayFallback, tomorrowFallback) });
      diagnostic('prayerTimes', { status: 'error', isStale: true, errorMessage: 'Prayer times unavailable.' });
      return todayFallback ? 'cached' : false;
    }
  },
  updateCountdown: () => {
    const { todaySchedule, tomorrowSchedule } = get();
    const today = todaySchedule && todaySchedule.gregorianDate === dateKey(todaySchedule.timezone) ? todaySchedule : null;
    const tomorrow = tomorrowSchedule && tomorrowSchedule.gregorianDate === dateKey(tomorrowSchedule.timezone, 1) ? tomorrowSchedule : null;
    set({ todaySchedule: today, tomorrowSchedule: tomorrow, nextPrayer: calculateNextPrayer(today, tomorrow) });
  },
}));

useSettingsStore.subscribe((next, previous) => {
  const key = (settings: typeof next.settings) => JSON.stringify([settings.activeLocation, settings.islamic.enabled, settings.islamic.calculationMethod, settings.islamic.asrMethod]);
  if (key(next.settings) !== key(previous.settings)) {
    generation += 1;
    useIslamicStore.setState({ contextKey: null, todaySchedule: null, tomorrowSchedule: null, nextPrayer: null, loading: false, error: null, isStale: false });
  }
});
