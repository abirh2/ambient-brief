import React from 'react';
import { TrendingDown, TrendingUp, LineChart } from 'lucide-react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line } from 'recharts';
import { MarketTicker } from '../../lib/types';
import { formatCurrencyValue, formatPercent } from '../../lib/formatting/numberUtils';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface MarketsPreviewCardProps {
  tickers: MarketTicker[];
}

export const MarketsPreviewCard: React.FC<MarketsPreviewCardProps> = ({ tickers }) => {
  const { settings } = useSettingsStore();

  if (!settings.showMarkets) {
    return null;
  }

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold tracking-tight text-slate-100">Markets</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">24h Overview</span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar max-h-[380px]">
        {tickers.map((item) => {
          const isPositive = item.changePercent >= 0;
          const strokeColor = isPositive ? '#4ade80' : '#f87171';

          return (
            <div
              key={item.symbol}
              className="p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex flex-col min-w-[100px]">
                <span className="text-sm font-semibold text-slate-100 font-mono">
                  {item.symbol}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[120px]">{item.name}</span>
              </div>

              {settings.showSparklines && item.sparklineData.length > 0 && (
                <div className="w-20 h-8 opacity-80 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={item.sparklineData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-bold font-mono text-slate-100">
                  {formatCurrencyValue(item.price)}
                </span>
                <div
                  className={`flex items-center gap-0.5 text-xs font-mono font-semibold ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{formatPercent(item.changePercent)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
