import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

interface SearchableCurrencySelectorProps {
  label: string;
  selected: string;
  onSelect: (code: string) => void;
  currencies: Record<string, string>;
  exclude?: string;
  placeholder?: string;
}

export function SearchableCurrencySelector({ label, selected, onSelect, currencies, exclude, placeholder = 'Search currencies' }: SearchableCurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', closeOutside);
    inputRef.current?.focus();
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [open]);

  const filtered = Object.entries(currencies).filter(([code, name]) => `${code} ${name}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="currency-selector" ref={containerRef}>
    <span className="settings-field-label">{label}</span>
    <button type="button" onClick={() => { setOpen((current) => !current); setQuery(''); }} aria-expanded={open} className="compact-control currency-selector-button"><span><strong>{selected}</strong><small>{currencies[selected] ?? selected}</small></span><ChevronDown aria-hidden="true" /></button>
    {open && <div className="currency-menu">
      <div className="currency-search"><Search aria-hidden="true" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} aria-label={`${label} currency search`} className="compact-control" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear currency search"><X aria-hidden="true" /></button>}</div>
      <div className="currency-options" role="listbox" aria-label={`${label} currencies`}>{filtered.length ? filtered.map(([code, name]) => <button key={code} type="button" role="option" aria-selected={code === selected} disabled={code === exclude} onClick={() => { onSelect(code); setOpen(false); }} className="compact-control"><span><strong>{code}</strong><small>{name}</small></span>{code === selected && <Check aria-hidden="true" />}</button>) : <p>No currencies found.</p>}</div>
    </div>}
  </div>;
}
