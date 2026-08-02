import { AppSettingsSchema } from '../lib/validation/schemas';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from './settingsDefaults';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Migrates persisted settings, then validates the complete normalized result. */
export function migrateSettings(value: unknown): AppSettings | null {
  if (!isRecord(value)) return null;

  const islamic = isRecord(value.islamic) ? value.islamic : {};
  const candidate = {
    ...DEFAULT_SETTINGS,
    ...value,
    version: 2,
    islamic: {
      ...DEFAULT_SETTINGS.islamic,
      ...islamic,
    },
  };

  const result = AppSettingsSchema.safeParse(candidate);
  return result.success ? result.data : null;
}
