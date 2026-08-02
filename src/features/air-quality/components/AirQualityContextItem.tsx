import { useEffect, useRef, useState } from 'react';
import { Loader2, Wind } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import type { AirQualityState } from '../hooks/useAirQuality';
import { interpretAqi } from '../utils/aqiInterpreter';
import { AirQualityPopover } from './AirQualityPopover';

export function AirQualityContextItem({ aqiState }: { aqiState: AirQualityState }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  if (aqiState.status === 'loading') return <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading AQI...</div>;
  if (aqiState.status === 'unavailable') return <div className="flex items-center gap-2 text-slate-500"><Wind className="w-3.5 h-3.5" />AQI unavailable</div>;
  const interpretation = interpretAqi(aqiState.data.usAqi);
  return <div className="relative" ref={ref}>
    <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-md" aria-haspopup="true" aria-expanded={open}>
      <Wind className={`w-3.5 h-3.5 ${interpretation.textClass}`} /><span className="text-slate-400">AQI</span><span className="font-semibold text-slate-100 font-mono">{aqiState.data.usAqi ?? '--'}</span><span className={`${interpretation.textClass} font-medium`}>· {interpretation.label}</span>
    </button>
    <AnimatePresence>{open && <AirQualityPopover data={aqiState.data} onClose={() => setOpen(false)} lastUpdatedText={aqiState.status === 'cached' ? aqiState.lastUpdatedText : undefined} />}</AnimatePresence>
  </div>;
}
