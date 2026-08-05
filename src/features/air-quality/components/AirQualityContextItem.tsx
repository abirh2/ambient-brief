import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AirQualityState } from '../hooks/useAirQuality';
import { interpretAqi } from '../utils/aqiInterpreter';
import { AirQualityPopover } from './AirQualityPopover';

export function AirQualityContextItem({ aqiState }: { aqiState: AirQualityState }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);
  if (aqiState.status === 'loading') return <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading AQI...</div>;
  if (aqiState.status === 'unavailable') return <div className="flex items-center gap-2 text-slate-500">AQI unavailable</div>;
  const interpretation = interpretAqi(aqiState.data.usAqi);
  return <div className="relative" ref={ref}>
    <button type="button" onClick={() => setOpen(!open)} className="compact-control flex items-center gap-2 px-2 py-1" aria-haspopup="true" aria-expanded={open}>
      <span className="text-[color:var(--text-muted)]">AQI</span><span className="context-value font-semibold">{aqiState.data.usAqi ?? '--'}</span><span className={`${interpretation.textClass} font-medium`}>· {interpretation.label}</span>
    </button>
    {open && <AirQualityPopover data={aqiState.data} onClose={() => setOpen(false)} lastUpdatedText={aqiState.status === 'cached' ? aqiState.lastUpdatedText : undefined} />}
  </div>;
}
