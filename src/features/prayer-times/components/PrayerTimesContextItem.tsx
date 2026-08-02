import { useEffect, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Loader2, Moon } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useIslamicStore } from '../../../stores/prayerTimesStore';

export function PrayerTimesContextItem() {
  const { settings } = useSettingsStore();
  const { todaySchedule, nextPrayer, loading, error, isStale } = useIslamicStore();
  const [expanded, setExpanded] = useState(settings.islamic.showFullSchedule);

  useEffect(() => {
    setExpanded(settings.islamic.showFullSchedule);
  }, [settings.islamic.showFullSchedule]);
  if (!settings.islamic.enabled) return null;
  return <div className="prayer-context flex flex-col gap-1.5 min-w-[220px]">
    <h3 className="context-heading text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Next Prayer</h3>
    <div className="flex items-start gap-2" title={`Calculation: ${settings.islamic.calculationMethod}, Asr: ${settings.islamic.asrMethod}`}>
      <Moon className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
      {loading && !todaySchedule ? <span className="flex gap-2 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" />Calculating...</span> : error && !todaySchedule ? <span className="text-red-400">Prayer times unavailable</span> : nextPrayer ? <div className="flex flex-col w-full">
        <div className="flex items-center justify-between gap-3"><span><strong className="text-slate-100 text-sm capitalize">{nextPrayer.name}</strong> <span className="text-indigo-300 font-mono ml-1">{nextPrayer.time}</span> <span className="text-slate-400 font-mono ml-1">· in {nextPrayer.timeRemainingText}</span></span>{todaySchedule && <button type="button" onClick={() => setExpanded(!expanded)} className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1" aria-expanded={expanded}>{expanded ? 'Hide' : 'Schedule'}{expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>}</div>
        {settings.islamic.showHijriDate && todaySchedule && <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400"><Calendar className="w-3 h-3" /><span>{todaySchedule.hijriDate.formatted}</span>{isStale && <span className="text-amber-400">(stale)</span>}</div>}
        {expanded && todaySchedule && <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5 text-xs font-mono">{todaySchedule.prayers.map((prayer) => <div key={prayer.name} className={`flex justify-between ${prayer.name === nextPrayer.name ? 'text-indigo-300 font-bold' : 'text-slate-300'}`}><span className="font-sans capitalize">{prayer.name}</span><span>{prayer.time}{prayer.name === nextPrayer.name && ' ← Next'}</span></div>)}</div>}
      </div> : <span className="text-slate-500">Calculating...</span>}
    </div>
  </div>;
}
