import React, { useState } from 'react';
import { Cloud, CloudRain, CloudSun, Moon, Sun, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, ChevronDown, ChevronUp } from 'lucide-react';
import { HourlyForecast as HourlyForecastType } from '../model';
import { useSettingsStore } from '../../../stores/settingsStore';
import { formatHourlyTimeLabel } from '../../../lib/formatting';

interface HourlyForecastProps {
  hourly: HourlyForecastType[];
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly }) => {
  const { settings } = useSettingsStore();
  const [expanded, setExpanded] = useState(false);

  const formatTemp = (val: number) => {
    return `${Math.round(val)}°`;
  };

  const renderWeatherIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Sun': return <Sun className={`${className} text-amber-300`} aria-label="Sunny" />;
      case 'SunCloud': return <CloudSun className={`${className} text-amber-200`} aria-label="Partly Cloudy" />;
      case 'Cloud': return <Cloud className={`${className} text-slate-300`} aria-label="Cloudy" />;
      case 'CloudRain': return <CloudRain className={`${className} text-sky-300`} aria-label="Rain" />;
      case 'CloudDrizzle': return <CloudDrizzle className={`${className} text-sky-200`} aria-label="Drizzle" />;
      case 'CloudSnow': return <CloudSnow className={`${className} text-indigo-200`} aria-label="Snow" />;
      case 'CloudLightning': return <CloudLightning className={`${className} text-amber-400`} aria-label="Thunderstorm" />;
      case 'CloudFog': return <CloudFog className={`${className} text-slate-400`} aria-label="Fog" />;
      case 'Moon': return <Moon className={`${className} text-slate-300`} aria-label="Clear Night" />;
      default: return <CloudSun className={`${className} text-amber-200`} aria-label="Partly Cloudy" />;
    }
  };

  const displayCount = expanded ? hourly.length : 6;
  const visibleHourly = hourly.slice(0, displayCount);

  return (
    <div className="w-full relative">
      {/* Continuous horizontal timeline line connecting points */}
      <div className="absolute top-[31px] left-4 right-4 h-px bg-white/10 pointer-events-none" />

      <div className={`hourly-points grid grid-cols-3 sm:grid-cols-6 gap-1 w-full text-center ${expanded ? 'sm:grid-cols-4 min-[1500px]:grid-cols-8' : ''}`}>
        {visibleHourly.map((item, idx) => {
          const showPrecip = item.pop >= 15;
          const isHighPrecip = item.pop >= 40;

          return (
            <div
              key={idx}
              className="group flex flex-col items-center justify-between py-1 px-0.5 rounded hover:bg-white/5 transition-colors relative"
            >
              <span className="text-[11px] font-mono text-slate-400 font-medium">
                {item.isoTime ? formatHourlyTimeLabel(item.isoTime, settings.timeFormat, settings.activeLocation?.timezone) : item.time}
              </span>

              <div className="my-1 p-1 z-10 transition-transform">
                {renderWeatherIcon(item.iconName, 'w-5 h-5')}
              </div>

              <span className="text-sm font-mono font-medium text-slate-100">
                {formatTemp(item.temp)}
              </span>

              <div className="h-4 flex items-center justify-center mt-0.5">
                {showPrecip ? (
                  <span className={`text-[10px] font-mono ${isHighPrecip ? 'text-sky-300 font-bold bg-sky-900/40 px-1 rounded' : 'text-sky-400/80 font-medium'}`}>
                    {item.pop}%
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      
      {!expanded && hourly.length > 6 && (
        <button 
          onClick={() => setExpanded(true)}
          className="w-full mt-2 py-1 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 transition-colors"
        >
          <span>Full forecast</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
      {expanded && (
        <button 
          onClick={() => setExpanded(false)}
          className="w-full mt-2 py-1 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 transition-colors"
        >
          <span>Compact view</span>
          <ChevronUp className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
