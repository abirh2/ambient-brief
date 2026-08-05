import { useEffect, useRef, useState } from 'react';
import { deriveTimeOfDay, deriveWeatherEffect } from '../../features/weather/utils/atmosphericCalculator';
import { useDevStateStore } from '../../lib/stores/useDevStateStore';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface AtmosphericBackgroundProps {
  currentWeatherCondition?: string;
  sunrise?: string;
  sunset?: string;
  timezone?: string;
  isWeatherAvailable?: boolean;
}

const TIME_STATE_REFRESH_MS = 5 * 60 * 1000;

/**
 * A deliberately small, non-interactive scene: the root paints the sky,
 * horizon, grain, and vignette while three children provide weather depth.
 * CSS owns all continuous motion so React remains idle between state changes.
 */
export function AtmosphericBackground({
  currentWeatherCondition,
  sunrise,
  sunset,
  timezone,
  isWeatherAvailable = true,
}: AtmosphericBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [timeSample, setTimeSample] = useState(() => Date.now());
  const { settings } = useSettingsStore();
  const { bgTimeOfDayOverride, bgWeatherOverride } = useDevStateStore();

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => setTimeSample(Date.now()), TIME_STATE_REFRESH_MS);
    return () => globalThis.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      if (rootRef.current) {
        rootRef.current.dataset.visibility = document.hidden ? 'hidden' : 'visible';
      }
    };

    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  const timeOfDay = bgTimeOfDayOverride === 'auto'
    ? deriveTimeOfDay(timezone, sunrise, sunset, new Date(timeSample))
    : bgTimeOfDayOverride;

  const weatherEffect = bgWeatherOverride === 'auto'
    ? isWeatherAvailable
      ? deriveWeatherEffect(currentWeatherCondition)
      : 'clear'
    : bgWeatherOverride;

  const motion = settings.reducedMotion ? 'static' : settings.backgroundMotion;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="atmospheric-background"
      data-motion={motion}
      data-time={timeOfDay}
      data-visibility="visible"
      data-weather={weatherEffect}
    >
      <span className="atmospheric-haze atmospheric-haze-a" />
      <span className="atmospheric-haze atmospheric-haze-b" />
      <span className="atmospheric-haze atmospheric-haze-c" />
    </div>
  );
}
