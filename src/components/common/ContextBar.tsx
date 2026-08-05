import { AirQualityContextItem } from '../../features/air-quality/components/AirQualityContextItem';
import { CurrencyContextItem } from '../../features/currency/components/CurrencyContextItem';
import { PrayerTimesContextItem } from '../../features/prayer-times/components/PrayerTimesContextItem';
import { formatSunTime } from '../../lib/formatting';
import { useSettingsStore } from '../../stores/settingsStore';
import type { AirQualityState } from '../../features/air-quality/hooks/useAirQuality';

interface ContextBarProps { uvIndex: number | null; uvLabel: string; sunset: string | null; weatherFreshness: string; aqiState: AirQualityState }

export function ContextBar({ uvIndex, uvLabel, sunset, weatherFreshness, aqiState }: ContextBarProps) {
  const { timeFormat, activeLocation } = useSettingsStore((state) => state.settings);
  const sunsetLabel = sunset ? formatSunTime(sunset, timeFormat, activeLocation?.timezone) : '--';

  return <aside className="context-bar-container w-full grid grid-cols-1 gap-5 items-start z-10" aria-label="At a glance">
    <div className="context-group flex flex-col gap-2"><h3 className="context-heading">At a glance</h3><div className="context-values flex flex-wrap items-center gap-x-5 gap-y-2"><AirQualityContextItem aqiState={aqiState} /><div className="flex items-center gap-1.5"><span className="text-[color:var(--text-muted)]">UV</span><span className="context-value font-semibold">{uvIndex ?? '--'}</span><span className="semantic-warning">· {uvLabel}</span></div><div className="flex items-center gap-1.5"><span className="text-[color:var(--text-muted)]">Sunset</span><span className="context-value font-semibold">{sunsetLabel}</span></div><CurrencyContextItem />{weatherFreshness !== 'Live' && <span className="context-freshness text-[color:var(--text-muted)]">Weather {weatherFreshness.toLowerCase()}</span>}</div></div>
    <PrayerTimesContextItem />
  </aside>;
}
