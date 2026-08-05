import React from 'react';
import { Clock, X, Activity } from 'lucide-react';
import { AirQualitySnapshot } from '../types';
import { interpretAqi } from '../utils/aqiInterpreter';
import { useSettingsStore } from '../../../stores/settingsStore';
import { formatDisplayTime } from '../../../lib/formatting';

interface AirQualityPopoverProps {
  data: AirQualitySnapshot;
  onClose: () => void;
  lastUpdatedText?: string;
}

export const AirQualityPopover: React.FC<AirQualityPopoverProps> = ({
  data,
  onClose,
  lastUpdatedText,
}) => {
  const aqi = data.usAqi;
  const interpretation = interpretAqi(aqi);
  const { timeFormat, activeLocation } = useSettingsStore((state) => state.settings);

  const formatPollutant = (val?: number) => {
    return val !== undefined && val !== null ? `${val} µg/m³` : 'N/A';
  };

  return (
    <div
      className="absolute bottom-full left-0 mb-3 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-white/10 backdrop-blur-xl text-slate-100 shadow-2xl p-5 z-50 font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <span className="font-semibold text-sm tracking-wide text-slate-100 uppercase">Air Quality Details</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main AQI Block */}
      <div className="flex items-center gap-4.5 bg-white/5 p-3.5 rounded-xl border border-white/5 mb-4">
        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${interpretation.bgClass} border border-white/5 shrink-0`}>
          <span className={`text-2xl font-bold font-mono tracking-tight ${interpretation.textClass}`}>
            {aqi !== null ? aqi : '--'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">US AQI</span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className={`text-base font-semibold leading-tight ${interpretation.textClass}`}>
            {interpretation.label}
          </span>
          <span className="text-xs text-slate-400 mt-1 leading-normal line-clamp-2">
            {interpretation.description}
          </span>
        </div>
      </div>

      {/* Guidance Section */}
      <div className="mb-4 bg-slate-900/50 p-3.5 rounded-xl border border-white/5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">General Guidance</span>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {interpretation.guidance}
        </p>
      </div>

      {/* Pollutant Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="flex flex-col p-2.5 bg-white/5 rounded-lg border border-white/5 items-center">
          <span className="text-[10px] font-medium text-slate-400 uppercase">PM2.5</span>
          <span className="text-xs font-semibold text-slate-100 font-mono mt-1">
            {formatPollutant(data.pm25)}
          </span>
        </div>
        <div className="flex flex-col p-2.5 bg-white/5 rounded-lg border border-white/5 items-center">
          <span className="text-[10px] font-medium text-slate-400 uppercase">PM10</span>
          <span className="text-xs font-semibold text-slate-100 font-mono mt-1">
            {formatPollutant(data.pm10)}
          </span>
        </div>
        <div className="flex flex-col p-2.5 bg-white/5 rounded-lg border border-white/5 items-center">
          <span className="text-[10px] font-medium text-slate-400 uppercase">Ozone</span>
          <span className="text-xs font-semibold text-slate-100 font-mono mt-1">
            {formatPollutant(data.ozone)}
          </span>
        </div>
      </div>

      {/* Footer / Last Updated */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {lastUpdatedText || `Observed at ${formatDisplayTime(data.measuredAt, { timeFormat, timeZone: activeLocation?.timezone })}`}
        </span>
      </div>
    </div>
  );
};
