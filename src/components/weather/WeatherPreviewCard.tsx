import React from 'react';
import { Cloud, CloudRain, CloudSun, Moon, Sun, Wind, Droplets } from 'lucide-react';
import { WeatherData } from '../../lib/types';
import { formatTemperature } from '../../lib/formatting/numberUtils';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface WeatherPreviewCardProps {
  data: WeatherData;
}

export const WeatherPreviewCard: React.FC<WeatherPreviewCardProps> = ({ data }) => {
  const { settings } = useSettingsStore();

  const renderWeatherIcon = (iconName: string, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={`${className} text-amber-300`} />;
      case 'SunCloud':
        return <CloudSun className={`${className} text-amber-200`} />;
      case 'Cloud':
        return <Cloud className={`${className} text-slate-300`} />;
      case 'CloudRain':
        return <CloudRain className={`${className} text-sky-300`} />;
      case 'Moon':
        return <Moon className={`${className} text-slate-300`} />;
      default:
        return <CloudSun className={`${className} text-amber-200`} />;
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="text-6xl sm:text-7xl font-light tracking-tighter text-slate-100 font-mono">
            {formatTemperature(data.temperature, settings.temperatureUnit)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xl font-semibold text-slate-100">
              {renderWeatherIcon(data.iconName, 'w-6 h-6')}
              <span>{data.condition}</span>
            </div>
            <span className="text-sm text-slate-400 mt-0.5">
              Feels like {formatTemperature(data.feelsLike, settings.temperatureUnit)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-300">
          <div className="text-sm font-medium text-slate-200">
            High {formatTemperature(data.high, settings.temperatureUnit)} · Low{' '}
            {formatTemperature(data.low, settings.temperatureUnit)}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-400" /> {data.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-slate-400" /> {data.windSpeedMph} mph
            </span>
          </div>
          {data.summaryNote && (
            <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] font-medium">
              <span>{data.summaryNote}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-white/10" />

      {/* Hourly Timeline */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-1">
        {data.hourly.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center gap-2 min-w-[56px] text-center p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-xs text-slate-400 font-mono">{item.time}</span>
            {renderWeatherIcon(item.iconName, 'w-5 h-5')}
            <span className="text-sm font-mono font-medium text-slate-100">
              {formatTemperature(item.temp, settings.temperatureUnit)}
            </span>
            {item.pop > 0 && (
              <span className="text-[10px] text-sky-400 font-mono font-semibold">
                {item.pop}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
