import { useState, useCallback, useMemo } from 'react';
import { useSettingsStore, DEFAULT_LOCATION } from '../lib/stores/useSettingsStore';
import { AppLocation } from '../lib/types';
import { AppLocationSchema } from '../lib/validation/schemas';
import { formatLocationLabel, formatCompactLocation } from '../lib/services/geocodingService';

export type DeviceLocationErrorType = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'unknown';

export interface DeviceLocationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  errorType?: DeviceLocationErrorType;
  errorMessage?: string;
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
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

        let cityName = '';
        let admin1Name = '';
        let countryName = '';
        let countryCode = '';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              cityName =
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.suburb ||
                data.address.county ||
                '';
              admin1Name = data.address.state || data.address.region || '';
              countryName = data.address.country || '';
              countryCode = (data.address.country_code || '').toUpperCase();
            }
          }
        } catch {
          // Fallback if reverse geocoding network fails
        }

        const resolvedName = cityName || `Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
        const savedLabel = [resolvedName, admin1Name].filter(Boolean).join(', ');

        const deviceLoc: AppLocation = {
          id: `device-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
          name: resolvedName,
          admin1: admin1Name,
          country: countryName,
          countryCode: countryCode,
          latitude,
          longitude,
          timezone,
          source: 'device',
        };

        setDeviceLocationState({ status: 'success' });

        updateSettings({
          useCurrentLocation: true,
          activeLocation: deviceLoc,
          savedLocation: savedLabel || resolvedName,
        });
      },
      (error) => {
        let errorType: DeviceLocationErrorType = 'unknown';
        let errorMessage = 'Failed to obtain current location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'denied';
            errorMessage = 'Location permission denied. You can search for a location manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = 'unavailable';
            errorMessage = 'Location information is unavailable. Please search manually.';
            break;
          case error.TIMEOUT:
            errorType = 'timeout';
            errorMessage = 'Location request timed out. Please try again or search manually.';
            break;
        }

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
