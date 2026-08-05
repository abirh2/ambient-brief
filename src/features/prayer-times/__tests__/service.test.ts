import { describe, expect, it } from 'vitest';
import { normalizeTimeStr, parseAladhanResponse } from '../service';

function response(hijri: unknown = { day: '22', year: '1448', date: '22-02-1448', month: { en: ' Safar ' } }) {
  return {
    timings: { Fajr: '05:10 (EDT)', Sunrise: '06:32 (EDT)', Dhuhr: '13:08 (EDT)', Asr: '18:05 (EDT)', Maghrib: '20:14 (EDT)', Isha: '21:37 (EDT)' },
    meta: { timezone: 'America/New_York' },
    date: { gregorian: { date: '05-08-2026' }, hijri },
  };
}

describe('prayer provider normalization', () => {
  it('uses structured Hijri fields instead of the numeric provider display string', () => {
    expect(parseAladhanResponse(response(), 'ISNA', 'Hanafi').hijriDate).toEqual({ day: 22, monthName: 'Safar', year: 1448 });
  });

  it('keeps missing Hijri data unavailable instead of fabricating a date', () => {
    expect(parseAladhanResponse(response(null), 'ISNA', 'Hanafi').hijriDate).toBeNull();
  });

  it('accepts a validated provider timezone annotation', () => {
    expect(normalizeTimeStr('18:05 (EDT)')).toBe('18:05');
  });

  it('rejects an invalid provider time annotation', () => {
    expect(() => normalizeTimeStr('18:05 definitely-live')).toThrow('Invalid provider prayer time');
  });
});
