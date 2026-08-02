import { z } from 'zod';
import { WeatherAlert } from '../../../lib/types';

const NwsAlertPropertiesSchema = z.object({
  id: z.string().min(1).optional(),
  event: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  instruction: z.string().nullable().optional(),
  severity: z.string().nullable().optional(),
  certainty: z.string().nullable().optional(),
  urgency: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  messageType: z.string().nullable().optional(),
  areaDesc: z.string().nullable().optional(),
  effective: z.string().nullable().optional(),
  onset: z.string().nullable().optional(),
  expires: z.string().nullable().optional(),
  ends: z.string().nullable().optional(),
  senderName: z.string().nullable().optional(),
});

const NwsAlertFeatureSchema = z.object({
  type: z.literal('Feature').optional(),
  id: z.string().min(1),
  properties: NwsAlertPropertiesSchema,
});

export const NwsAlertsResponseSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(NwsAlertFeatureSchema),
});

type NwsAlertFeature = z.infer<typeof NwsAlertFeatureSchema>;
type NwsSeverity = WeatherAlert['severity'];

const severityWeight: Record<NwsSeverity, number> = {
  extreme: 5,
  severe: 4,
  moderate: 3,
  minor: 2,
  unknown: 1,
};

const urgencyWeight: Record<string, number> = {
  immediate: 5,
  expected: 4,
  future: 3,
  past: 2,
  unknown: 1,
};

function normalizeSeverity(value: string | null | undefined): NwsSeverity {
  const severity = value?.trim().toLowerCase();
  return severity === 'minor' || severity === 'moderate' || severity === 'severe' || severity === 'extreme'
    ? severity
    : 'unknown';
}

function normalizedValue(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function firstEndTime(alert: Pick<WeatherAlert, 'expires' | 'ends'>): number | null {
  const times = [alert.expires, alert.ends]
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));
  return times.length ? Math.min(...times) : null;
}

/** Converts a validated NWS GeoJSON feature into the app's provider-neutral alert model. */
export function normalizeNWSAlert(feature: NwsAlertFeature): WeatherAlert {
  const props = feature.properties;
  return {
    // NWS's feature identifier is the stable CAP alert identifier used for dismissal.
    id: feature.id,
    event: props.event?.trim() || 'Weather Alert',
    headline: props.headline?.trim() || props.event?.trim() || 'Weather alert issued',
    description: props.description?.trim() || 'No detailed description is available.',
    instruction: props.instruction?.trim() || undefined,
    severity: normalizeSeverity(props.severity),
    certainty: props.certainty?.trim() || 'Unknown',
    urgency: props.urgency?.trim() || 'Unknown',
    status: props.status?.trim() || 'Actual',
    messageType: props.messageType?.trim() || 'Alert',
    areaDescription: props.areaDesc?.trim() || 'Affected area',
    effective: props.effective ?? undefined,
    onset: props.onset ?? undefined,
    expires: props.expires ?? undefined,
    ends: props.ends ?? undefined,
    senderName: props.senderName?.trim() || 'National Weather Service',
    source: 'National Weather Service',
  };
}

export function isActiveNWSAlert(alert: WeatherAlert, now = Date.now()): boolean {
  const status = normalizedValue(alert.status);
  const messageType = normalizedValue(alert.messageType);
  if (status === 'test' || status === 'cancelled' || messageType === 'test' || messageType === 'cancel') {
    return false;
  }
  const endTime = firstEndTime(alert);
  return endTime === null || endTime > now;
}

/** Sorts most severe and urgent alerts first, with earliest expiration as a stable tie-breaker. */
export function sortNWSAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  return [...alerts].sort((first, second) => {
    const severityDifference = severityWeight[second.severity] - severityWeight[first.severity];
    if (severityDifference !== 0) return severityDifference;

    const urgencyDifference = (urgencyWeight[normalizedValue(second.urgency)] ?? 1)
      - (urgencyWeight[normalizedValue(first.urgency)] ?? 1);
    if (urgencyDifference !== 0) return urgencyDifference;

    return (firstEndTime(first) ?? Number.POSITIVE_INFINITY) - (firstEndTime(second) ?? Number.POSITIVE_INFINITY);
  });
}

export function buildNWSAlertsUrl(latitude: number, longitude: number): string {
  return `https://api.weather.gov/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

/** Fetches and validates NWS GeoJSON. US-only gating belongs to the location-aware hook. */
export async function fetchNWSAlerts(latitude: number, longitude: number, signal?: AbortSignal): Promise<WeatherAlert[]> {
  const response = await fetch(buildNWSAlertsUrl(latitude, longitude), {
    signal,
    headers: { Accept: 'application/geo+json' },
  });
  if (!response.ok) throw new Error(`NWS alerts request failed (${response.status} ${response.statusText})`);

  const responseBody: unknown = await response.json();
  const data = NwsAlertsResponseSchema.parse(responseBody);
  return sortNWSAlerts(data.features.map(normalizeNWSAlert).filter((alert) => isActiveNWSAlert(alert)));
}
