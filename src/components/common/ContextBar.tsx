import { Clock, Sun, Sunset } from 'lucide-react';
import { AirQualityContextItem } from '../../features/air-quality/components/AirQualityContextItem';
import { CurrencyContextItem } from '../../features/currency/components/CurrencyContextItem';
import { PrayerTimesContextItem } from '../../features/prayer-times/components/PrayerTimesContextItem';

interface ContextBarProps { uvIndex: number | null; uvLabel: string; sunset: string | null; weatherFreshness: string }

export function ContextBar({ uvIndex, uvLabel, sunset, weatherFreshness }: ContextBarProps) {
  return <div className="context-bar-container w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-[1900px]:grid-cols-1 gap-4 px-4 sm:px-5 py-4 rounded-xl bg-slate-900/40 border border-white/10 backdrop-blur-md text-sm text-slate-300 font-sans shadow-md items-start">
    <div className="flex flex-col gap-2"><h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Environment</h3><AirQualityContextItem /><div className="flex items-center gap-2"><Sun className="w-3.5 h-3.5 text-amber-400" /><span className="text-slate-400 w-16">UV</span><span className="font-semibold text-slate-100 font-mono">{uvIndex ?? '--'}</span><span className="text-amber-300 text-xs">· {uvLabel}</span></div><div className="flex items-center gap-2"><Sunset className="w-3.5 h-3.5 text-indigo-400" /><span className="text-slate-400 w-16">Sunset</span><span className="font-semibold text-slate-100 font-mono">{sunset ?? '--'}</span></div></div>
    <div className="flex flex-col gap-2"><h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Finance</h3><CurrencyContextItem /><div className="flex items-center gap-2 mt-1"><Clock className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-400">Last refreshed</span><span className="font-semibold text-slate-100 font-mono text-xs">{weatherFreshness}</span></div></div>
    <PrayerTimesContextItem />
  </div>;
}
