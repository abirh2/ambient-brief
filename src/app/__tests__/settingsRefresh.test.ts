import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../stores/settingsDefaults';
import { changedProviders, getSettingsFingerprint } from '../useAmbientBriefController';

describe('settings refresh boundaries', () => {
  it('does not refetch prayer data for visual formatting changes', () => {
    const previous = getSettingsFingerprint(DEFAULT_SETTINGS);
    const formatted = {
      ...DEFAULT_SETTINGS,
      timeFormat: '24h' as const,
      islamic: { ...DEFAULT_SETTINGS.islamic, showHijriDate: false, showFullSchedule: true },
    };
    expect(changedProviders(previous, getSettingsFingerprint(formatted))).not.toContain('prayerTimes');
  });

  it('refetches prayer data for calculation and Hanafi Asr changes', () => {
    const previous = getSettingsFingerprint(DEFAULT_SETTINGS);
    const calculationChanged = {
      ...DEFAULT_SETTINGS,
      islamic: { ...DEFAULT_SETTINGS.islamic, calculationMethod: 'MWL' },
    };
    const asrChanged = {
      ...DEFAULT_SETTINGS,
      islamic: { ...DEFAULT_SETTINGS.islamic, asrMethod: 'Standard' },
    };
    expect(changedProviders(previous, getSettingsFingerprint(calculationChanged))).toContain('prayerTimes');
    expect(changedProviders(previous, getSettingsFingerprint(asrChanged))).toContain('prayerTimes');
  });
});
