import { Clock, Sun, Sunset } from 'lucide-react';
import { AirQualityContextItem } from '../../features/air-quality/components/AirQualityContextItem';
import { CurrencyContextItem } from '../../features/currency/components/CurrencyContextItem';
import { PrayerTimesContextItem } from '../../features/prayer-times/components/PrayerTimesContextItem';
import { formatSunTime } from '../../lib/formatting';
import { useSettingsStore } from '../../stores/settingsStore';
import type { AirQualityState } from '../../features/air-quality/hooks/useAirQuality';

interface ContextBarProps { uvIndex: number | null; uvLabel: string; sunset: string | null; weatherFreshness: string; aqiState: AirQualityState }

export function ContextBar({ uvIndex, uvLabel, sunset, weatherFreshness, aqiState }: ContextBarProps) {
  const timeFormat = useSettingsStore((state) => state.settings.timeFormat);
  const sunsetLabel = sunset ? formatSunTime(sunset, timeFormat) : '--';

  return <aside className="context-bar-container w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_auto] gap-x-6 gap-y-3 px-1 sm:px-2 pt-2 pb-1 border-t border-white/10 text-xs text-slate-300 font-sans items-start z-10" aria-label="Contextual information">
    <div className="context-group flex flex-wrap items-center gap-x-4 gap-y-1.5"><h3 className="context-heading text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 w-full">Environment</h3><AirQualityContextItem aqiState={aqiState} /><div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-400" /><span className="text-slate-400">UV</span><span className="font-semibold text-slate-100 font-mono">{uvIndex ?? '--'}</span><span className="text-amber-300">· {uvLabel}</span></div><div className="flex items-center gap-1.5"><Sunset className="w-3.5 h-3.5 text-indigo-400" /><span className="text-slate-400">Sunset</span><span className="font-semibold text-slate-100 font-mono">{sunsetLabel}</span></div></div>
    <div className="context-group flex flex-wrap items-center gap-x-4 gap-y-1.5"><h3 className="context-heading text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 w-full">Finance</h3><CurrencyContextItem /><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-400">Weather</span><span className="font-semibold text-slate-100 font-mono text-[11px]">{weatherFreshness}</span></div></div>
    <PrayerTimesContextItem />
  </aside>;
}
