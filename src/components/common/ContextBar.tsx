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

  return <aside className="context-bar-container w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_auto] gap-x-6 gap-y-3 px-1 sm:px-2 pt-2 pb-1 border-t border-white/10 items-start z-10" aria-label="Contextual information">
    <div className="context-group flex flex-wrap items-center gap-x-4 gap-y-1.5"><h3 className="context-heading w-full">Environment</h3><AirQualityContextItem aqiState={aqiState} /><div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 semantic-warning" /><span className="text-[color:var(--text-muted)]">UV</span><span className="context-value font-semibold">{uvIndex ?? '--'}</span><span className="semantic-warning">· {uvLabel}</span></div><div className="flex items-center gap-1.5"><Sunset className="w-3.5 h-3.5 semantic-info" /><span className="text-[color:var(--text-muted)]">Sunset</span><span className="context-value font-semibold">{sunsetLabel}</span></div></div>
    <div className="context-group flex flex-wrap items-center gap-x-4 gap-y-1.5"><h3 className="context-heading w-full">Finance</h3><CurrencyContextItem /><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[color:var(--text-subtle)]" /><span className="text-[color:var(--text-muted)]">Weather</span><span className="context-value font-semibold">{weatherFreshness}</span></div></div>
    <PrayerTimesContextItem />
  </aside>;
}
