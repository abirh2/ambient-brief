import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableCurrencySelectorProps {
  label: string;
  selected: string;
  onSelect: (code: string) => void;
  currencies: Record<string, string>;
  exclude?: string;
  placeholder?: string;
}

export const SearchableCurrencySelector: React.FC<SearchableCurrencySelectorProps> = ({
  label,
  selected,
  onSelect,
  currencies,
  exclude,
  placeholder = 'Search currency...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle open and focus input
  const handleToggle = () => {
    setIsOpen(!isOpen);
    setSearchQuery('');
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Standardize currencies list
  const currencyList = Object.entries(currencies).map(([code, name]) => ({
    code,
    name,
  }));

  // Filter currency list based on search query
  const filteredList = currencyList.filter(({ code, name }) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return code.toLowerCase().includes(query) || name.toLowerCase().includes(query);
  });

  const selectedName = currencies[selected] || selected || 'Select currency';

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={containerRef} id={`currency-selector-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">{label}</span>
      
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-white/15 hover:border-white/25 text-left text-xs text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="font-mono font-bold text-indigo-300">{selected}</span>
            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{selectedName}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-xl bg-slate-950 border border-white/15 shadow-2xl p-2 flex flex-col gap-2 max-h-[280px] overflow-hidden">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Currency List */}
            <div className="overflow-y-auto flex-grow flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-white/10 pr-0.5">
              {filteredList.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-4">No currencies found</div>
              ) : (
                filteredList.map(({ code, name }) => {
                  const isExcluded = exclude === code;
                  const isSelected = selected === code;

                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={isExcluded}
                      onClick={() => {
                        onSelect(code);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors text-xs ${
                        isSelected
                          ? 'bg-indigo-600/30 text-indigo-200 font-medium'
                          : isExcluded
                          ? 'opacity-40 cursor-not-allowed text-slate-600'
                          : 'hover:bg-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono font-bold">{code}</span>
                        <span className="text-[10px] text-slate-400 truncate">{name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
