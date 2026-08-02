import { useState } from 'react';
import { Calendar, Loader2, Moon } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useIslamicStore } from '../../../stores/prayerTimesStore';

export function PrayerTimesContextItem() {
  const { settings } = useSettingsStore();
  const { todaySchedule, nextPrayer, loading, error, isStale } = useIslamicStore();
  const [expanded, setExpanded] = useState(false);
  if (!settings.islamic.enabled) return null;
  return <div className="flex flex-col gap-2">
    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Islamic Schedule</h3>
    {settings.islamic.showNextPrayer && <div className="flex items-start gap-2" title={`Calculation: ${settings.islamic.calculationMethod}, Asr: ${settings.islamic.asrMethod}`}>
      <Moon className="w-3.5 h-3.5 text-indigo-400 mt-0.5" />
      {loading && !todaySchedule ? <span className="flex gap-2 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" />Calculating...</span> : error && !todaySchedule ? <span className="text-red-400">Prayer times unavailable</span> : nextPrayer ? <div className="flex flex-col w-full">
        <div className="flex justify-between gap-2"><span><strong className="text-slate-100 text-base capitalize">{nextPrayer.name}</strong> <span className="text-indigo-300 font-mono">{nextPrayer.time}</span></span>{settings.islamic.showFullSchedule && <button type="button" onClick={() => setExpanded(!expanded)} className="text-xs text-slate-400 hover:text-slate-200">{expanded ? 'Hide' : 'Full schedule'}</button>}</div>
        <span className="text-slate-400 text-xs font-mono">in {nextPrayer.timeRemainingText}{isStale && <span className="text-amber-400 ml-1">(stale)</span>}</span>
        {expanded && todaySchedule && <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5 text-xs font-mono">{todaySchedule.prayers.map((prayer) => <div key={prayer.name} className={`flex justify-between ${prayer.name === nextPrayer.name ? 'text-indigo-300 font-bold' : 'text-slate-300'}`}><span className="font-sans capitalize">{prayer.name}</span><span>{prayer.time}{prayer.name === nextPrayer.name && ' ← Next'}</span></div>)}</div>}
      </div> : <span className="text-slate-500">Calculating...</span>}
    </div>}
    {settings.islamic.showHijriDate && todaySchedule && <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span className="text-xs text-slate-300">{todaySchedule.hijriDate.formatted}{isStale && <span className="text-amber-400 ml-1">(stale)</span>}</span></div>}
  </div>;
}
