import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { MarketInstrument } from '../model';
import { useSettingsStore } from '../../../stores/settingsStore';
import { formatCurrencyValue, formatPercent } from '../../../lib/formatting';

interface StockListProps {
  stocks: MarketInstrument[];
}

export const StockList: React.FC<StockListProps> = ({ stocks }) => {
  const { settings } = useSettingsStore();

  const filteredStocks = React.useMemo(() => {
    if (settings.marketSymbols && settings.marketSymbols.length > 0) {
      return stocks.filter((stock) => settings.marketSymbols.includes(stock.symbol));
    }
    return stocks;
  }, [stocks, settings.marketSymbols]);

  return (
    <div className="stock-scroll-container flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-1 no-scrollbar">
      {filteredStocks.map((stock) => {
        const isPositive = (stock.changePercent ?? 0) >= 0;
        const strokeColor = isPositive ? '#10b981' : '#ef4444';
        const price = stock.latestPrice ?? stock.price ?? 0;

        return (
          <div
            key={stock.symbol}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 hover:bg-white/5 border border-white/5 transition-colors"
          >
            {/* Symbol & Name */}
            <div className="flex flex-col min-w-[100px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-mono text-slate-100">
                  {stock.symbol}
                </span>
                <span className="text-[10px] text-slate-400 font-sans hidden sm:inline truncate max-w-[120px]">
                  {stock.displayName || stock.name}
                </span>
              </div>
            </div>

            {/* Sparkline mini chart */}
            {settings.showSparklines && stock.sparklineData && (
              <div className="w-16 h-5 opacity-70 hidden xs:block">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={strokeColor}
                      strokeWidth={1.2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Price & Change Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-100">
                ${formatCurrencyValue(price)}
              </span>

              <div
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  isPositive
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    : 'bg-red-950/60 text-red-300 border border-red-800/40'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3" aria-label="Gain" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" aria-label="Loss" />
                )}
                <span>
                  {formatPercent(stock.changePercent ?? 0)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
