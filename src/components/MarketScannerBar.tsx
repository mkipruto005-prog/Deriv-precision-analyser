import React from 'react';
import { DerivSymbol } from '../types';
import { DERIV_SYMBOLS } from '../constants/symbols';
import { Zap, TrendingUp, TrendingDown, ShieldCheck, ChevronRight } from 'lucide-react';
import { getMarketTickHistory } from '../services/under8Analysis';

interface MarketScannerBarProps {
  currentSymbol: DerivSymbol;
  onSelectSymbol: (symbol: DerivSymbol) => void;
}

export const MarketScannerBar: React.FC<MarketScannerBarProps> = ({
  currentSymbol,
  onSelectSymbol
}) => {
  // Key high-liquidity synthetic indices to feature in the radar
  const featuredIds = ['1HZ100V', '1HZ75V', '1HZ50V', 'R_100', 'R_75', 'R_50'];
  const featuredSymbols = featuredIds
    .map(id => DERIV_SYMBOLS.find(s => s.id === id))
    .filter((s): s is DerivSymbol => Boolean(s));

  return (
    <div id="market-scanner-bar" className="space-y-2">
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2 font-bold text-slate-300 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multi-Market Synthetic Radar (Live Edge Scanner)</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Click any market to switch &amp; trade instantly
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {featuredSymbols.map((sym) => {
          const isSelected = sym.id === currentSymbol?.id;
          const ticks = getMarketTickHistory(sym.id);
          const lastTick = ticks[ticks.length - 1];
          const price = lastTick ? lastTick.quote : 0;
          const lastDigit = lastTick ? lastTick.lastDigit : null;

          // Compute quick sample metrics
          const sample = ticks.slice(-40);
          const under8Count = sample.filter(t => t.lastDigit < 8).length;
          const under8Edge = sample.length > 0 ? (under8Count / sample.length) * 100 : 80;

          // Digit distribution
          const digitCounts: Record<number, number> = {};
          sample.forEach(t => {
            digitCounts[t.lastDigit] = (digitCounts[t.lastDigit] || 0) + 1;
          });
          let coldestDigit = 0;
          let minCount = 999;
          for (let d = 0; d <= 9; d++) {
            const count = digitCounts[d] || 0;
            if (count < minCount) {
              minCount = count;
              coldestDigit = d;
            }
          }

          const isPrime = under8Edge >= 85;

          return (
            <button
              key={sym.id}
              onClick={() => onSelectSymbol(sym)}
              className={`p-2.5 rounded-xl text-left border transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-slate-850 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              {/* Active Indicator Bar */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}

              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-xs text-white group-hover:text-emerald-300 transition-colors truncate">
                  {sym?.name || sym?.id}
                </span>
                {lastDigit !== null && (
                  <span className={`w-4 h-4 rounded text-[10px] font-mono font-bold flex items-center justify-center ${
                    lastDigit < 8 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {lastDigit}
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate">
                  {price > 0 ? price.toFixed((sym?.pipSize ?? 2) > 2 ? 2 : (sym?.pipSize ?? 2)) : 'Connecting...'}
                </span>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className={isPrime ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    &lt;8: {under8Edge.toFixed(0)}%
                  </span>
                </div>
                <span className="px-1 py-0.2 rounded bg-teal-500/15 text-teal-300 text-[9px] border border-teal-500/30">
                  Cold #{coldestDigit}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
