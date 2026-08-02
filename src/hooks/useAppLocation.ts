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
      (position) => {
        const { latitude, longitude } = position.coords;
        // Open-Meteo's official geocoding API supports city-name search, but not
        // reverse geocoding. Reuse the already normalized city label only when
        // the device coordinates are close enough to that saved city to remain
        // truthful. Otherwise ask the user to resolve the city through search.
        if (distanceInKilometers(activeLocation, { latitude, longitude }) > 25) {
          setDeviceLocationState({
            status: 'error',
            errorType: 'unavailable',
            errorMessage:
              'Coordinates detected, but Open-Meteo cannot resolve a city name from coordinates. Search for your city to finish setting the location.',
          });
          updateSettings({ useCurrentLocation: false });
          return;
        }

        const deviceLoc: AppLocation = {
          id: `device-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
          name: activeLocation.name,
          admin1: activeLocation.admin1,
          country: activeLocation.country,
          countryCode: activeLocation.countryCode,
          latitude,
          longitude,
          timezone: activeLocation.timezone,
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
  }, [activeLocation, updateSettings]);

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

function distanceInKilometers(
  first: Pick<AppLocation, 'latitude' | 'longitude'>,
  second: Pick<AppLocation, 'latitude' | 'longitude'>
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
