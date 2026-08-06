import { useState, useCallback, useMemo } from 'react';
import { useSettingsStore, DEFAULT_LOCATION } from '../lib/stores/useSettingsStore';
import { AppLocation } from '../lib/types';
import { AppLocationSchema } from '../lib/validation/schemas';
import { formatLocationLabel, formatCompactLocation } from '../lib/services/geocodingService';
import {
  reverseGeocodeDeviceLocation,
  type ReverseGeocodedLocation,
} from '../lib/services/reverseGeocodingService';

export type DeviceLocationErrorType = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'unknown';

export interface DeviceLocationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  errorType?: DeviceLocationErrorType;
  errorMessage?: string;
}

export function getDeviceLocationError(
  error: Pick<GeolocationPositionError, 'code'>
): Pick<DeviceLocationState, 'errorType' | 'errorMessage'> {
  switch (error.code) {
    case 1:
      return {
        errorType: 'denied',
        errorMessage: 'Location permission denied. You can search for a location manually.',
      };
    case 2:
      return {
        errorType: 'unavailable',
        errorMessage: 'Location information is unavailable. Please search manually.',
      };
    case 3:
      return {
        errorType: 'timeout',
        errorMessage: 'Location request timed out. Please try again or search manually.',
      };
    default:
      return {
        errorType: 'unknown',
        errorMessage: 'Failed to obtain current location.',
      };
  }
}

/**
 * Validates an AppLocation object to ensure coordinates and fields are valid.
 * Returns DEFAULT_LOCATION if invalid.
 */
export function validateAndSanitizeLocation(loc: unknown): AppLocation {
  const result = AppLocationSchema.safeParse(loc);
  if (result.success) {
    const data = result.data as AppLocation;
    if (
      Number.isFinite(data.latitude) &&
      data.latitude >= -90 &&
      data.latitude <= 90 &&
      Number.isFinite(data.longitude) &&
      data.longitude >= -180 &&
      data.longitude <= 180
    ) {
      return data;
    }
  }
  return DEFAULT_LOCATION;
}

export function useAppLocation() {
  const { settings, updateSettings } = useSettingsStore();

  const [deviceLocationState, setDeviceLocationState] = useState<DeviceLocationState>({
    status: 'idle',
  });

  const activeLocation = useMemo<AppLocation>(() => {
    return validateAndSanitizeLocation(settings.activeLocation);
  }, [settings.activeLocation]);

  const formattedLabel = useMemo(() => {
    return formatLocationLabel(activeLocation);
  }, [activeLocation]);

  const compactLabel = useMemo(() => {
    return formatCompactLocation(activeLocation);
  }, [activeLocation]);

  /**
   * Request device geolocation upon explicit user trigger
   */
  const requestDeviceLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setDeviceLocationState({
        status: 'error',
        errorType: 'unsupported',
        errorMessage: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setDeviceLocationState({ status: 'loading' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        let resolvedLocation: ReverseGeocodedLocation | undefined;
        try {
          resolvedLocation = await reverseGeocodeDeviceLocation(latitude, longitude);
        } catch {
          // The coordinates remain valid if the optional naming request fails.
          // Keep location-driven data live with a truthful generic label.
        }

        const deviceLoc: AppLocation = {
          id: `device-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
          name: resolvedLocation?.name ?? 'My Location',
          admin1: resolvedLocation?.admin1,
          country: resolvedLocation?.country ?? '',
          countryCode: resolvedLocation?.countryCode ?? '',
          latitude,
          longitude,
          timezone: getDeviceTimeZone(),
          source: 'device',
        };

        setDeviceLocationState({ status: 'success' });

        updateSettings({
          useCurrentLocation: true,
          activeLocation: deviceLoc,
          savedLocation: formatLocationLabel(deviceLoc),
        });
      },
      (error) => {
        const { errorType, errorMessage } = getDeviceLocationError(error);

        setDeviceLocationState({
          status: 'error',
          errorType,
          errorMessage,
        });

        updateSettings({ useCurrentLocation: false });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [updateSettings]);

  const setCustomLocation = useCallback(
    (location: AppLocation) => {
      const sanitized = validateAndSanitizeLocation(location);
      const formatted = formatLocationLabel(sanitized);

      updateSettings({
        useCurrentLocation: false,
        activeLocation: sanitized,
        savedLocation: formatted,
      });

      setDeviceLocationState({ status: 'idle' });
    },
    [updateSettings]
  );

  const clearLocation = useCallback(() => {
    updateSettings({
      useCurrentLocation: false,
      activeLocation: DEFAULT_LOCATION,
      savedLocation: formatLocationLabel(DEFAULT_LOCATION),
    });
    setDeviceLocationState({ status: 'idle' });
  }, [updateSettings]);

  const toggleUseCurrentLocation = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        requestDeviceLocation();
      } else {
        updateSettings({ useCurrentLocation: false });
        setDeviceLocationState({ status: 'idle' });
      }
    },
    [requestDeviceLocation, updateSettings]
  );

  return {
    activeLocation,
    formattedLabel,
    compactLabel,
    useCurrentLocation: settings.useCurrentLocation,
    deviceLocationState,
    requestDeviceLocation,
    setCustomLocation,
    toggleUseCurrentLocation,
    clearLocation,
  };
}

function getDeviceTimeZone(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timeZone || 'UTC';
}
