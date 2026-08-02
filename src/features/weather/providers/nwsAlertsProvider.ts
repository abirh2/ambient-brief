import { WeatherAlert } from '../../../lib/types';
import { useDiagnosticsStore } from '../../../lib/api/diagnosticsStore';

export interface DismissedAlert {
  id: string;
  dismissedAt: string;
  expiresAt?: string;
}

/**
 * Normalizes GeoJSON feature properties into a WeatherAlert conformant to the requested schema.
 */
export function normalizeNWSAlert(feature: any): WeatherAlert {
  const props = feature.properties || {};
  
  // Lowercase the severity for consistency
  const rawSeverity = (props.severity || 'unknown').toLowerCase();
  let severity: "minor" | "moderate" | "severe" | "extreme" | "unknown" = "unknown";
  if (['minor', 'moderate', 'severe', 'extreme'].includes(rawSeverity)) {
    severity = rawSeverity as any;
  }

  return {
    id: props.id || feature.id || Math.random().toString(36).substring(2, 11),
    event: props.event || 'Weather Alert',
    headline: props.headline || props.event || 'No Headline Provided',
    description: props.description || 'No detailed description available.',
    instruction: props.instruction || undefined,
    severity,
    certainty: props.certainty || 'Unknown',
    urgency: props.urgency || 'Unknown',
    status: props.status || 'Actual',
    messageType: props.messageType || 'Alert',
    areaDescription: props.areaDesc || 'Affected Area',
    effective: props.effective,
    onset: props.onset,
    expires: props.expires,
    ends: props.ends,
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
  
  const updateDiag = (status: 'loading' | 'success' | 'error', extra: any = {}) => {
    try {
      useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', {
        status,
        responseTimeMs: Date.now() - startTime,
        lastFetchedAt: new Date().toISOString(),
        ...extra,
      });
    } catch (e) {
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
        errorCategory: 'nws_api_failure',
      });
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    // Quick validation of geojson schema
    if (!data || typeof data !== 'object' || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error('Invalid GeoJSON response format from NWS API');
    }

    const alerts = data.features.map(normalizeNWSAlert);
    
    updateDiag('success', {
      statusCode: response.status,
      cacheSource: 'network',
    });

    return alerts;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    const isCors = error instanceof TypeError && error.message.includes('Failed to fetch');
    const errorMessage = isCors 
      ? 'Cross-Origin Resource Sharing (CORS) restriction or network error blocked browser direct access to weather.gov.' 
      : error?.message || 'Network request failed';

    updateDiag('error', {
      statusCode: isCors ? undefined : 0,
      errorMessage,
      errorCategory: isCors ? 'cors_block' : 'network_failure',
    });

    throw error;
  }
}
