import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { MarketInstrument } from '../../lib/types';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { ETF_PROXIES } from '../../features/markets/alphaVantageService';

interface IndexSummaryProps {
  indices: MarketInstrument[];
}

export const IndexSummary: React.FC<IndexSummaryProps> = ({ indices }) => {
  const { settings } = useSettingsStore();

  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {indices.map((idxItem) => {
        const isPositive = (idxItem.changePercent ?? 0) >= 0;
        const strokeColor = isPositive ? '#10b981' : '#ef4444';
        const price = idxItem.latestPrice ?? idxItem.price ?? 0;
        const proxyInfo = ETF_PROXIES[idxItem.symbol];
        const displayLabel = proxyInfo ? proxyInfo.displayName : idxItem.displayName || idxItem.name || idxItem.symbol;

        return (
          <div
            key={idxItem.symbol}
            className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex flex-col justify-between gap-1 hover:bg-white/5 transition-colors"
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold font-mono text-slate-200 truncate" title={displayLabel}>
                {displayLabel}
              </span>
              <div
                className={`flex items-center gap-0.5 text-[10px] font-mono font-semibold shrink-0 ${
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" aria-label="Up" />
                ) : (
                  <TrendingDown className="w-3 h-3" aria-label="Down" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {(idxItem.changePercent ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-sm font-bold font-mono text-slate-100">
                ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {settings.showSparklines && idxItem.sparklineData && idxItem.sparklineData.length > 0 && (
              <div className="w-full h-6 mt-1 opacity-75">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={idxItem.sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={strokeColor}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
