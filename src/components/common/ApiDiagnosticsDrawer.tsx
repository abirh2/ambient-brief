import React from 'react';
import { Activity, X, RefreshCw, CheckCircle2, AlertTriangle, Clock, Database, Server } from 'lucide-react';
import { useDiagnosticsStore } from '../../lib/api/diagnosticsStore';

export const ApiDiagnosticsDrawer: React.FC = () => {
  const { records, isDrawerOpen, setDrawerOpen, resetAll } = useDiagnosticsStore();

  if (!isDrawerOpen) return null;

  const providerList = Object.values(records);

  return (
    <div
      role="dialog"
      aria-label="API Integration Diagnostics Panel"
      className="fixed bottom-14 right-4 z-50 w-full max-w-lg bg-slate-900/95 border border-indigo-500/30 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 font-sans text-xs overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm tracking-wide text-white">API Integration Diagnostics</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
            DEV ONLY
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetAll}
            title="Reset Diagnostics Metrics"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close Diagnostics"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Provider Status Grid */}
      <div className="p-3 max-h-[380px] overflow-y-auto flex flex-col gap-2.5 divide-y divide-white/5">
        {providerList.map((p) => {
          const isError = p.status === 'error';
          const isSuccess = p.status === 'success';
          const isLoading = p.status === 'loading';

          return (
            <div key={p.providerId} className="pt-2.5 first:pt-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">{p.providerName}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                    isSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isError
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isLoading
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-white/10'
                  }`}
                >
                  {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {isError && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                  {isLoading && <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />}
                  {p.status.toUpperCase()}
                </span>
              </div>

              {/* Detail Pills */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                {p.lastFetchedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    {new Date(p.lastFetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}

                {p.cacheSource && (
                  <span className="flex items-center gap-1">
                    {p.cacheSource === 'cache' ? (
                      <Database className="w-3 h-3 text-sky-400" />
                    ) : (
                      <Server className="w-3 h-3 text-emerald-400" />
                    )}
                    {p.cacheSource}
                    {p.isStale && <span className="text-amber-400">(stale)</span>}
                  </span>
                )}

                {p.responseTimeMs !== undefined && (
                  <span className="text-slate-300">{p.responseTimeMs}ms</span>
                )}

                {p.statusCode && (
                  <span className={p.statusCode >= 400 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    HTTP {p.statusCode}
                  </span>
                )}
              </div>

              {/* Error Banner */}
              {isError && p.errorMessage && (
                <div className="mt-1 p-2 rounded bg-rose-950/60 border border-rose-500/30 text-rose-200 text-[11px]">
                  <span className="font-bold uppercase text-rose-400 mr-1.5">[{p.errorCategory || 'error'}]:</span>
                  {p.errorMessage}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-950/80 border-t border-white/10 text-[10px] text-slate-400 text-center">
        All clients feature automatic retries, timeouts, schemas, and stale-while-revalidate caching.
      </div>
    </div>
  );
};
