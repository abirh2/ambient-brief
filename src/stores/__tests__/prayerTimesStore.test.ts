import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyPrayerSchedule, PrayerName } from '../../features/prayer-times/model';
import { createDateInTimeZone } from '../../lib/formatting';

vi.mock('../../features/prayer-times/service', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../features/prayer-times/service')>(),
  fetchScheduleForDate: vi.fn(),
}));

const TIMEZONE = 'America/New_York';
const TIMES: Array<[PrayerName, string]> = [
  ['fajr', '05:10'], ['sunrise', '06:32'], ['dhuhr', '13:08'],
  ['asr', '18:05'], ['maghrib', '20:14'], ['isha', '21:37'],
];

function schedule(day = 5, method = 'ISNA', school: 'hanafi' | 'standard' = 'hanafi'): DailyPrayerSchedule {
  return {
    gregorianDate: `${String(day).padStart(2, '0')}-08-2026`,
    timezone: TIMEZONE,
    hijriDate: null,
    prayers: TIMES.map(([name, time]) => {
      const [hour, minute] = time.split(':').map(Number);
      return { name, time, timestamp: createDateInTimeZone(2026, 8, day, hour, minute, TIMEZONE) };
    }),
    calculationMethod: method,
    asrMethod: school,
  };
}

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
}

async function stores() {
  const { useIslamicStore } = await import('../prayerTimesStore');
  const { useSettingsStore } = await import('../settingsStore');
  const { fetchScheduleForDate } = await import('../../features/prayer-times/service');
  useSettingsStore.getState().updateSettings((previous) => ({
    islamic: { ...previous.islamic, enabled: true },
  }));
  return { useIslamicStore, useSettingsStore, fetchSchedule: vi.mocked(fetchScheduleForDate) };
}

describe('prayer schedule context retention', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T16:00:00Z'));
    vi.stubGlobal('localStorage', memoryStorage());
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([
    ['location', 40, -75, 'ISNA', 'Hanafi'],
    ['calculation method', 39.9601, -75.2638, 'MWL', 'Hanafi'],
    ['Asr school', 39.9601, -75.2638, 'ISNA', 'Standard'],
  ] as const)('rejects last-good data after a %s change fails', async (_name, lat, lng, method, school) => {
    const { useIslamicStore, fetchSchedule } = await stores();
    fetchSchedule.mockResolvedValueOnce(schedule(5)).mockResolvedValueOnce(schedule(6));
    await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi');
    fetchSchedule.mockRejectedValue(new Error('Offline'));

    const result = await useIslamicStore.getState().fetchSchedules(lat, lng, method, school);

    expect(result).toBe(false);
    expect(useIslamicStore.getState().todaySchedule).toBeNull();
    expect(useIslamicStore.getState().nextPrayer).toBeNull();
  });

  it('retains valid same-context last-good schedules when refresh fails', async () => {
    const { useIslamicStore, fetchSchedule } = await stores();
    fetchSchedule.mockResolvedValueOnce(schedule(5)).mockResolvedValueOnce(schedule(6));
    await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi');
    fetchSchedule.mockRejectedValue(new Error('Offline'));

    expect(await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi', true)).toBe('cached');
    expect(useIslamicStore.getState().todaySchedule?.gregorianDate).toBe('05-08-2026');
    expect(useIslamicStore.getState().nextPrayer?.name).toBe('dhuhr');
  });

  it('retains successful today when tomorrow stalls past the shared deadline', async () => {
    const { useIslamicStore, fetchSchedule } = await stores();
    fetchSchedule
      .mockResolvedValueOnce(schedule(5))
      .mockImplementationOnce(() => new Promise(() => undefined));

    const pending = useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi');
    await vi.advanceTimersByTimeAsync(15_001);

    expect(await pending).toBe('cached');
    expect(useIslamicStore.getState().todaySchedule?.gregorianDate).toBe('05-08-2026');
    expect(useIslamicStore.getState().tomorrowSchedule).toBeNull();
    expect(useIslamicStore.getState().nextPrayer?.name).toBe('dhuhr');
    expect(useIslamicStore.getState().loading).toBe(false);
    expect(useIslamicStore.getState().isStale).toBe(true);
  });

  it('does not trust legacy global backups whose location identity is absent', async () => {
    localStorage.setItem('ambient_brief_last_valid_today_v1', JSON.stringify(schedule(5)));
    localStorage.setItem('ambient_brief_last_valid_tomorrow_v1', JSON.stringify(schedule(6)));
    const { useIslamicStore, fetchSchedule } = await stores();
    expect(useIslamicStore.getState().todaySchedule).toBeNull();
    fetchSchedule.mockRejectedValue(new Error('Offline'));

    expect(await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi')).toBe(false);
    expect(useIslamicStore.getState().todaySchedule).toBeNull();
  });

  it('rejects expired backups after the local calendar date changes', async () => {
    const { useIslamicStore, fetchSchedule } = await stores();
    fetchSchedule.mockResolvedValueOnce(schedule(5)).mockResolvedValueOnce(schedule(6));
    await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi');
    vi.setSystemTime(new Date('2026-08-08T16:00:00Z'));
    fetchSchedule.mockRejectedValue(new Error('Offline'));

    expect(await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi')).toBe(false);
    expect(useIslamicStore.getState().todaySchedule).toBeNull();
    expect(useIslamicStore.getState().nextPrayer).toBeNull();
  });

  it('does not restore yesterday from a backup when a pending refresh crosses local midnight', async () => {
    const { useIslamicStore, fetchSchedule } = await stores();
    vi.setSystemTime(new Date('2026-08-06T03:59:55Z'));
    fetchSchedule.mockResolvedValueOnce(schedule(5)).mockResolvedValueOnce(schedule(6));
    await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi');
    let completeToday: (value: DailyPrayerSchedule) => void = () => { throw new Error('Missing deferred request'); };
    let completeTomorrow: (value: DailyPrayerSchedule) => void = () => { throw new Error('Missing deferred request'); };
    fetchSchedule
      .mockImplementationOnce(() => new Promise((resolve) => { completeToday = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { completeTomorrow = resolve; }));
    const pending = useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi', true);

    vi.setSystemTime(new Date('2026-08-06T04:00:01Z'));
    completeToday(schedule(5));
    completeTomorrow(schedule(6));
    await pending.catch(() => undefined);

    const state = useIslamicStore.getState();
    expect(state.todaySchedule?.gregorianDate ?? null).not.toBe('05-08-2026');
    expect(state.todaySchedule?.gregorianDate ?? null).toBeOneOf([null, '06-08-2026']);
    expect(state.tomorrowSchedule?.gregorianDate ?? null).toBeOneOf([null, '07-08-2026']);
    expect(state.nextPrayer?.timestamp.getTime() ?? Date.now() + 1).toBeGreaterThan(Date.now());
    expect(state.loading).toBe(false);
  });

  it('does not publish a late success after cancellation', async () => {
    const { useIslamicStore, fetchSchedule } = await stores();
    let completeToday: (value: DailyPrayerSchedule) => void = () => { throw new Error('Missing deferred request'); };
    let completeTomorrow: (value: DailyPrayerSchedule) => void = () => { throw new Error('Missing deferred request'); };
    fetchSchedule
      .mockImplementationOnce(() => new Promise((resolve) => { completeToday = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { completeTomorrow = resolve; }));
    const controller = new AbortController();
    const pending = useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi', false, controller.signal);
    controller.abort();
    completeToday(schedule(5));
    completeTomorrow(schedule(6));
    await pending.catch(() => undefined);

    expect(useIslamicStore.getState().todaySchedule).toBeNull();
    expect(useIslamicStore.getState().nextPrayer).toBeNull();
  });

  it('does not let an older pending context overwrite a newer schedule', async () => {
    const { useIslamicStore, fetchSchedule } = await stores();
    let completeToday: (value: DailyPrayerSchedule) => void = () => { throw new Error('Missing deferred request'); };
    let completeTomorrow: (value: DailyPrayerSchedule) => void = () => { throw new Error('Missing deferred request'); };
    fetchSchedule
      .mockImplementationOnce(() => new Promise((resolve) => { completeToday = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { completeTomorrow = resolve; }))
      .mockResolvedValueOnce(schedule(5, 'MWL'))
      .mockResolvedValueOnce(schedule(6, 'MWL'));
    const pending = useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi');
    await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'MWL', 'Hanafi');
    completeToday(schedule(5));
    completeTomorrow(schedule(6));
    await pending.catch(() => undefined);

    expect(useIslamicStore.getState().todaySchedule?.calculationMethod).toBe('MWL');
    expect(useIslamicStore.getState().tomorrowSchedule?.calculationMethod).toBe('MWL');
  });

  it('fails softly for corrupt retained storage without manufacturing a schedule', async () => {
    localStorage.setItem('ambient_brief_last_valid_today_v1', '{broken');
    const { useIslamicStore, fetchSchedule } = await stores();
    fetchSchedule.mockRejectedValue(new Error('Offline'));

    expect(await useIslamicStore.getState().fetchSchedules(39.9601, -75.2638, 'ISNA', 'Hanafi')).toBe(false);
    expect(useIslamicStore.getState().todaySchedule).toBeNull();
  });
});
