import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { useDevStateStore } from '../../lib/stores/useDevStateStore';
import { TimeOfDayVariant, WeatherEffectVariant } from '../../lib/types';
import { deriveTimeOfDay, deriveWeatherEffect } from '../../features/weather/utils/atmosphericCalculator';

interface AtmosphericBackgroundProps {
  currentWeatherCondition?: string;
  sunrise?: string;
  sunset?: string;
  timezone?: string;
  isWeatherAvailable?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({
  currentWeatherCondition,
  sunrise,
  sunset,
  timezone,
  isWeatherAvailable = true,
}) => {
  const { settings } = useSettingsStore();
  const { bgTimeOfDayOverride, bgWeatherOverride } = useDevStateStore();

  const [isTabHidden, setIsTabHidden] = useState(false);

  // Monitor tab visibility to pause animations when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Determine effective time of day
  const getTimeOfDay = (): TimeOfDayVariant => {
    if (bgTimeOfDayOverride !== 'auto') {
      return bgTimeOfDayOverride;
    }
    return deriveTimeOfDay(timezone, sunrise, sunset);
  };

  // Determine effective weather effect
  const getWeatherEffect = (): WeatherEffectVariant => {
    if (bgWeatherOverride !== 'auto') {
      return bgWeatherOverride;
    }
    if (!isWeatherAvailable || !currentWeatherCondition) {
      return 'clear';
    }
    return deriveWeatherEffect(currentWeatherCondition);
  };

  const timeOfDay = getTimeOfDay();
  const weatherEffect = getWeatherEffect();

  // Determine motion class
  const motionSetting = settings.reducedMotion ? 'static' : settings.backgroundMotion;
  const motionClass =
    isTabHidden
      ? 'tab-hidden'
      : motionSetting === 'living'
      ? 'motion-living'
      : motionSetting === 'subtle'
      ? 'motion-subtle'
      : 'motion-static';

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[-1] w-full h-full overflow-hidden bg-[#04060c] pointer-events-none select-none ${motionClass}`}
    >
      {/* LAYER 1: BASE TIME-OF-DAY GRADIENT */}
      <TimeOfDayBaseGradient timeOfDay={timeOfDay} weatherEffect={weatherEffect} />

      {/* LAYER 2: LARGE ATMOSPHERIC CLOUD & LIGHT FORMS */}
      <AtmosphericLightForms timeOfDay={timeOfDay} weatherEffect={weatherEffect} />

      {/* LAYER 3: OPTIONAL WEATHER EFFECT LAYER */}
      <WeatherEffectLayer weatherEffect={weatherEffect} timeOfDay={timeOfDay} />

      {/* LAYER 4: SUBTLE STATIC GRAIN TEXTURE */}
      <div className="atmospheric-grain absolute inset-0 opacity-35 pointer-events-none mix-blend-overlay" />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* LAYER 1: BASE TIME-OF-DAY GRADIENT                                         */
/* -------------------------------------------------------------------------- */
const TimeOfDayBaseGradient: React.FC<{
  timeOfDay: TimeOfDayVariant;
  weatherEffect: WeatherEffectVariant;
}> = ({ timeOfDay, weatherEffect }) => {
  const getGradientStyles = () => {
    switch (timeOfDay) {
      case 'morning':
        return {
          base: 'bg-gradient-to-b from-[#091322] via-[#1c2135] to-[#2d1b28]',
          horizon: 'bg-[radial-gradient(ellipse_at_50%_75%,rgba(217,119,6,0.18)_0%,rgba(190,24,93,0.12)_35%,rgba(9,19,34,0)_75%)]',
          upperSky: 'bg-[radial-gradient(ellipse_at_50%_10%,rgba(99,102,241,0.15)_0%,rgba(9,19,34,0)_60%)]',
        };
      case 'day':
        return {
          base: 'bg-gradient-to-b from-[#081225] via-[#0f1d38] to-[#070d1a]',
          horizon: 'bg-[radial-gradient(ellipse_at_50%_65%,rgba(51,65,85,0.25)_0%,rgba(30,41,59,0.15)_40%,rgba(7,13,26,0)_80%)]',
          upperSky: 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12)_0%,rgba(8,18,37,0)_60%)]',
        };
      case 'sunset':
        return {
          base: 'bg-gradient-to-b from-[#080914] via-[#1e142d] to-[#31131a]',
          horizon: 'bg-[radial-gradient(ellipse_at_50%_80%,rgba(217,119,6,0.22)_0%,rgba(190,24,93,0.18)_40%,rgba(8,9,20,0)_80%)]',
          upperSky: 'bg-[radial-gradient(ellipse_at_50%_10%,rgba(99,102,241,0.15)_0%,rgba(8,9,20,0)_60%)]',
        };
      case 'night':
      default:
        return {
          base: 'bg-gradient-to-b from-[#02050c] via-[#080f21] to-[#03060f]',
          horizon: 'bg-[radial-gradient(ellipse_at_50%_70%,rgba(30,27,75,0.3)_0%,rgba(15,23,42,0.2)_45%,rgba(2,5,12,0)_80%)]',
          upperSky: 'bg-[radial-gradient(ellipse_at_50%_15%,rgba(99,102,241,0.12)_0%,rgba(2,5,12,0)_70%)]',
        };
    }
  };

  const styles = getGradientStyles();
  const isStorm = weatherEffect === 'storm';

  return (
    <div className="absolute inset-0 w-full h-full transition-colors duration-1000">
      {/* Primary Gradient Base */}
      <div className={`absolute inset-0 ${styles.base}`} />

      {/* Horizon Soft Glow */}
      <div className={`absolute inset-0 ${styles.horizon}`} />

      {/* Upper Sky Depth */}
      <div className={`absolute inset-0 ${styles.upperSky}`} />

      {/* Storm Darkening Overlay */}
      {isStorm && (
        <div className="absolute inset-0 bg-slate-950/45 mix-blend-multiply transition-opacity duration-700" />
      )}

      {/* Night-time Sparse Understated Star Points */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* 12 sparse, fixed star points with varying sizes and opacities */}
            <circle cx="12%" cy="18%" r="1" fill="#cbd5e1" className="animate-star" style={{ animationDelay: '0s' }} />
            <circle cx="28%" cy="10%" r="1.2" fill="#e2e8f0" className="animate-star" style={{ animationDelay: '1.5s' }} />
            <circle cx="45%" cy="22%" r="0.8" fill="#94a3b8" className="animate-star" style={{ animationDelay: '3s' }} />
            <circle cx="62%" cy="14%" r="1.1" fill="#e2e8f0" className="animate-star" style={{ animationDelay: '0.8s' }} />
            <circle cx="78%" cy="25%" r="0.9" fill="#cbd5e1" className="animate-star" style={{ animationDelay: '2.2s' }} />
            <circle cx="88%" cy="12%" r="1" fill="#cbd5e1" className="animate-star" style={{ animationDelay: '4.1s' }} />
            <circle cx="20%" cy="38%" r="0.8" fill="#94a3b8" className="animate-star" style={{ animationDelay: '2.7s' }} />
            <circle cx="70%" cy="42%" r="1" fill="#e2e8f0" className="animate-star" style={{ animationDelay: '1.2s' }} />
          </svg>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* LAYER 2: LARGE ATMOSPHERIC CLOUD & LIGHT FORMS                             */
/* -------------------------------------------------------------------------- */
const AtmosphericLightForms: React.FC<{
  timeOfDay: TimeOfDayVariant;
  weatherEffect: WeatherEffectVariant;
}> = ({ timeOfDay, weatherEffect }) => {
  const getFormColors = () => {
    switch (timeOfDay) {
      case 'morning':
        return {
          formA: 'from-amber-500/15 via-rose-500/10 to-transparent',
          formB: 'from-indigo-500/15 via-slate-500/10 to-transparent',
          formC: 'from-rose-600/12 via-orange-500/08 to-transparent',
        };
      case 'day':
        return {
          formA: 'from-slate-400/12 via-indigo-400/08 to-transparent',
          formB: 'from-sky-500/10 via-slate-600/08 to-transparent',
          formC: 'from-slate-500/12 via-blue-500/06 to-transparent',
        };
      case 'sunset':
        return {
          formA: 'from-amber-600/18 via-rose-600/12 to-transparent',
          formB: 'from-purple-600/15 via-indigo-600/10 to-transparent',
          formC: 'from-rose-500/14 via-amber-500/10 to-transparent',
        };
      case 'night':
      default:
        return {
          formA: 'from-indigo-600/12 via-slate-700/08 to-transparent',
          formB: 'from-blue-600/10 via-indigo-900/12 to-transparent',
          formC: 'from-slate-700/10 via-indigo-800/06 to-transparent',
        };
    }
  };

  const colors = getFormColors();
  const isCloudyOrStorm = weatherEffect === 'cloudy' || weatherEffect === 'storm' || weatherEffect === 'fog';

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* Form A: Top-Left Ambient Orb */}
      <div
        className={`absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-br ${colors.formA} blur-[100px] animate-cloud-a opacity-80`}
      />

      {/* Form B: Top-Right Soft Light Shape */}
      <div
        className={`absolute -top-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[750px] max-h-[750px] rounded-full bg-gradient-to-bl ${colors.formB} blur-[110px] animate-cloud-b opacity-75`}
      />

      {/* Form C: Center-Bottom Horizon Cushion */}
      <div
        className={`absolute -bottom-[20%] left-[15%] w-[70vw] h-[50vw] max-w-[900px] max-h-[600px] rounded-full bg-gradient-to-t ${colors.formC} blur-[120px] animate-cloud-c opacity-70`}
      />

      {/* Additional Large Atmospheric Cloud Mass for Cloudy/Storm */}
      {isCloudyOrStorm && (
        <div className="absolute top-[20%] -left-[15%] w-[90vw] h-[40vw] max-w-[1100px] rounded-full bg-gradient-to-r from-slate-800/20 via-slate-700/15 to-transparent blur-[90px] animate-cloud-b opacity-80" />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* LAYER 3: WEATHER-EFFECT LAYER                                              */
/* -------------------------------------------------------------------------- */
const WeatherEffectLayer: React.FC<{
  weatherEffect: WeatherEffectVariant;
  timeOfDay: TimeOfDayVariant;
}> = ({ weatherEffect }) => {
  if (weatherEffect === 'clear') return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      {/* Cloudy Effect */}
      {weatherEffect === 'cloudy' && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(148,163,184,0.08)_0%,rgba(15,23,42,0)_60%)] animate-fog opacity-90" />
      )}

      {/* Rain Effect: Fine diagonal streaks using SVG background patterns */}
      {weatherEffect === 'rain' && (
        <div className="absolute inset-0 w-full h-full opacity-25 animate-rain">
          <svg className="w-full h-[150%]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="rainPattern" width="60" height="120" patternUnits="userSpaceOnUse">
                <line x1="10" y1="0" x2="2" y2="40" stroke="#cbd5e1" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="35" y1="20" x2="27" y2="60" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.3" />
                <line x1="50" y1="70" x2="42" y2="110" stroke="#e2e8f0" strokeWidth="1.2" strokeOpacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rainPattern)" />
          </svg>
        </div>
      )}

      {/* Snow Effect: Low-density soft flakes */}
      {weatherEffect === 'snow' && (
        <div className="absolute inset-0 w-full h-full opacity-35 animate-snow">
          <svg className="w-full h-[150%]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="snowPattern" width="100" height="200" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="30" r="2" fill="#ffffff" fillOpacity="0.6" />
                <circle cx="70" cy="80" r="1.5" fill="#f1f5f9" fillOpacity="0.5" />
                <circle cx="45" cy="140" r="2.5" fill="#ffffff" fillOpacity="0.4" />
                <circle cx="85" cy="180" r="1.2" fill="#e2e8f0" fillOpacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#snowPattern)" />
          </svg>
        </div>
      )}

      {/* Storm Effect: Atmospheric pressure gloom */}
      {weatherEffect === 'storm' && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-indigo-950/20 to-slate-950/50" />
      )}

      {/* Fog Effect: Horizontal mist band */}
      {weatherEffect === 'fog' && (
        <div className="absolute top-[35%] left-0 w-[140%] h-[30%] bg-gradient-to-r from-transparent via-slate-400/10 to-transparent blur-3xl animate-fog opacity-80" />
      )}
    </div>
  );
};
