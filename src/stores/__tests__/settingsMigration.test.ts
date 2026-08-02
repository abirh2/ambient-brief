import { describe, expect, it } from 'vitest';
import { migrateSettings } from '../settingsMigration';
import { DEFAULT_SETTINGS } from '../settingsDefaults';

describe('migrateSettings', () => {
  it('migrates version 1 settings and fills newly introduced defaults', () => {
    const migrated = migrateSettings({
      ...DEFAULT_SETTINGS,
      version: 1,
      contentDensity: 'compact',
      islamic: { enabled: true },
    });

    expect(migrated).toMatchObject({
      version: 2,
      contentDensity: 'compact',
      islamic: {
        enabled: true,
        calculationMethod: DEFAULT_SETTINGS.islamic.calculationMethod,
      },
    });
  });

  it('rejects malformed restored values', () => {
    expect(migrateSettings({ ...DEFAULT_SETTINGS, temperatureUnit: 'kelvin' })).toBeNull();
    expect(migrateSettings('not settings')).toBeNull();
  });
});
