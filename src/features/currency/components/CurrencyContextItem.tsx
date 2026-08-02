import { useEffect, useRef, useState } from 'react';
import { DollarSign, Loader2, X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useCurrencyStore } from '../../../stores/currencyStore';
import { formatCurrencyValue, formatRelativeTime } from '../../../lib/formatting';

export function CurrencyContextItem() {
  const { settings } = useSettingsStore();
  const { rate, rateLoading, rateError, isStale, fetchExchangeRate } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [base, quote] = settings.currencyPair.split('/');
  useEffect(() => { if (settings.currencyEnabled && base && quote) void fetchExchangeRate(base, quote); }, [base, fetchExchangeRate, quote, settings.currencyEnabled]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  if (!settings.currencyEnabled) return <div className="text-slate-500 text-xs italic">Currency disabled</div>;
  return <div className="relative w-fit" ref={ref} id="context-bar-currency">
    <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 -ml-2 rounded-md" aria-haspopup="true" aria-expanded={open}>
      <DollarSign className="w-3.5 h-3.5 text-sky-400" /><span className="text-slate-400 w-14 font-mono">{settings.currencyPair}</span>
      {rateLoading && !rate ? <Loader2 className="w-3 h-3 animate-spin" /> : rateError ? <span className="text-red-400">Unavailable</span> : rate ? <span className="font-semibold text-slate-100 font-mono">{formatCurrencyValue(rate.rate)}{isStale && <span className="text-[10px] text-amber-400 ml-1 font-sans font-normal">(stale)</span>}</span> : <span className="text-slate-500">--</span>}
    </button>
    <AnimatePresence>{open && <div className="absolute bottom-full left-0 mb-2 w-72 p-4 rounded-xl bg-slate-950 border border-white/15 shadow-2xl text-xs text-slate-200 z-50 flex flex-col gap-3 backdrop-blur-md">
      <div className="flex justify-between border-b border-white/10 pb-2"><strong className="text-sm">Exchange Rate Details</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close details"><X className="w-3.5 h-3.5" /></button></div>
      {rateLoading && <div className="flex justify-center py-4 gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" />Fetching latest rates...</div>}
      {rateError && !rateLoading && <div className="text-center py-2 text-red-400 bg-red-950/20 rounded-lg">{rateError}</div>}
      {rate && !rateLoading && <><div className="bg-slate-900/50 p-3 rounded-lg text-center"><span className="block text-[10px] text-slate-400 uppercase">Current Reference Rate</span><strong className="text-xl font-mono">1 {rate.base} = {rate.rate.toFixed(4)} {rate.quote}</strong></div><div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400"><span>Reference Date:</span><span className="text-right text-slate-200">{rate.date}</span><span>Data Source:</span><span className="text-right text-slate-200">Frankfurter API</span><span>Last Fetched:</span><span className="text-right text-slate-200">{formatRelativeTime(rate.fetchedAt)}</span></div><p className="text-[9px] text-slate-500 text-center italic">Reference rate; not a guaranteed consumer conversion rate</p></>}
    </div>}</AnimatePresence>
  </div>;
}
