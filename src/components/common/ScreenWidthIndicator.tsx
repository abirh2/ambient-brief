import React, { useState } from 'react';
import { Monitor, X, EyeOff } from 'lucide-react';
import { useViewportWidth } from '../../hooks/useViewportWidth';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

export const ScreenWidthIndicator: React.FC = () => {
  const { width, height, breakpoint } = useViewportWidth();
  const { settings, toggleDevWidthIndicator } = useSettingsStore();
  const [minimized, setMinimized] = useState(false);

  if (!settings.showDevWidthIndicator) {
    return null;
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        title="Show viewport width indicator"
        className="fixed bottom-12 right-4 z-50 p-2 rounded-full bg-slate-900/80 text-slate-300 border border-white/10 backdrop-blur-md shadow-lg hover:bg-slate-800 transition-all font-mono text-xs flex items-center gap-1"
      >
        <Monitor className="w-3.5 h-3.5 text-sky-400" />
        <span>{width}px</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-12 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-slate-200 border border-white/15 backdrop-blur-xl shadow-xl font-mono text-xs selection:bg-none select-none">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Monitor className="w-3.5 h-3.5 text-sky-400" />
        <span className="font-semibold text-white">{width}px</span>
        <span className="text-slate-400">×</span>
        <span className="text-slate-400">{height}px</span>
        <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 uppercase text-[10px] font-bold">
          {breakpoint}
        </span>
      </div>

      <div className="h-3 w-px bg-white/15 mx-1" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => setMinimized(true)}
          title="Minimize indicator"
          className="p-1 hover:text-white text-slate-400 rounded hover:bg-white/10 transition-colors"
        >
          <EyeOff className="w-3 h-3" />
        </button>
        <button
          onClick={toggleDevWidthIndicator}
          title="Dismiss development indicator (re-enable in Settings)"
          className="p-1 hover:text-red-400 text-slate-400 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
