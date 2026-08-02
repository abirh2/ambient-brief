import { WeatherAlert } from '../../../lib/types';
import { useDiagnosticsStore } from '../../../lib/api/diagnosticsStore';
import { ProviderDiagnostic } from '../../../lib/api/types';
import { z } from 'zod';

const NwsAlertPropertiesSchema = z.object({
  id: z.string().optional(),
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
  id: z.string().optional(),
  properties: NwsAlertPropertiesSchema,
});

const NwsAlertsResponseSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(NwsAlertFeatureSchema),
});

type NwsAlertFeature = z.infer<typeof NwsAlertFeatureSchema>;
type NwsSeverity = WeatherAlert['severity'];

function normalizeSeverity(value: string | null | undefined): NwsSeverity {
  const severity = value?.toLowerCase();
  if (severity === 'minor' || severity === 'moderate' || severity === 'severe' || severity === 'extreme') {
    return severity;
  }
  return 'unknown';
}

export interface DismissedAlert {
  id: string;
  dismissedAt: string;
  expiresAt?: string;
}

/**
 * Normalizes GeoJSON feature properties into a WeatherAlert conformant to the requested schema.
 */
export function normalizeNWSAlert(feature: NwsAlertFeature): WeatherAlert {
  const props = feature.properties;
  return {
    id: props.id || feature.id || Math.random().toString(36).substring(2, 11),
    event: props.event || 'Weather Alert',
    headline: props.headline || props.event || 'No Headline Provided',
    description: props.description || 'No detailed description available.',
    instruction: props.instruction || undefined,
    severity: normalizeSeverity(props.severity),
    certainty: props.certainty || 'Unknown',
    urgency: props.urgency || 'Unknown',
    status: props.status || 'Actual',
    messageType: props.messageType || 'Alert',
    areaDescription: props.areaDesc || 'Affected Area',
    effective: props.effective ?? undefined,
    onset: props.onset ?? undefined,
    expires: props.expires ?? undefined,
    ends: props.ends ?? undefined,
    senderName: props.senderName || 'National Weather Service',
    source: 'National Weather Service',
  };
}

/**
 * Fetches active NWS alerts for the given latitude and longitude.
 */
export async function fetchNWSAlerts(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<WeatherAlert[]> {
  const url = `https://api.weather.gov/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const startTime = Date.now();
  
  const updateDiag = (
    status: ProviderDiagnostic['status'],
    extra: Partial<ProviderDiagnostic> = {},
  ) => {
    try {
      useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', {
        status,
        responseTimeMs: Date.now() - startTime,
        ...(status === 'success' ? { lastFetchedAt: new Date().toISOString() } : {}),
        ...extra,
      });
    } catch {
      // Ignore diagnostics store failures
    }
  };

  updateDiag('loading');

  try {
    const response = await fetch(url, {
      signal,
      headers: {
        // NWS API guidelines recommend setting a User-Agent or Accept header
        'Accept': 'application/geo+json',
      }
    });

    if (!response.ok) {
      const errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      updateDiag('error', {
        statusCode: response.status,
        errorMessage: errorMsg,
        errorCategory: 'http',
      });
      throw new Error(errorMsg);
    }

    const data = NwsAlertsResponseSchema.parse(await response.json());

    const alerts = data.features.map(normalizeNWSAlert);
    
    updateDiag('success', {
      statusCode: response.status,
      cacheSource: 'network',
    });

    return alerts;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    const isCors = error instanceof TypeError && error.message.includes('Failed to fetch');
    const errorMessage = isCors 
      ? 'Cross-Origin Resource Sharing (CORS) restriction or network error blocked browser direct access to weather.gov.' 
      : error instanceof Error ? error.message : 'Network request failed';

    updateDiag('error', {
      statusCode: isCors ? undefined : 0,
      errorMessage,
      errorCategory: 'network',
    });

    throw error;
  }
}
