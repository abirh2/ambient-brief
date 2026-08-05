import { Activity, Sun, Sunset } from 'lucide-react';
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

  return <aside className="context-bar-container w-full grid grid-cols-1 gap-5 items-start z-10" aria-label="Contextual information">
    <div className="context-group flex flex-col gap-2"><h3 className="context-heading">Environment</h3><div className="context-values flex flex-wrap items-center gap-x-4 gap-y-2"><AirQualityContextItem aqiState={aqiState} /><div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 semantic-warning" /><span className="text-[color:var(--text-muted)]">UV</span><span className="context-value font-semibold">{uvIndex ?? '--'}</span><span className="semantic-warning">· {uvLabel}</span></div><div className="flex items-center gap-1.5"><Sunset className="w-3.5 h-3.5 semantic-info" /><span className="text-[color:var(--text-muted)]">Sunset</span><span className="context-value font-semibold">{sunsetLabel}</span></div><span className="context-freshness text-[color:var(--text-muted)]">Weather {weatherFreshness.toLowerCase()}</span></div></div>
    <div className="context-group flex flex-col gap-2"><h3 className="context-heading">Finance</h3><div className="context-values flex flex-wrap items-center gap-x-4 gap-y-2"><CurrencyContextItem /><div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-[color:var(--text-subtle)]" /><span className="text-[color:var(--text-muted)]">Markets</span><span className="context-value font-semibold">Provider-labelled</span></div></div></div>
    <PrayerTimesContextItem />
  </aside>;
}
