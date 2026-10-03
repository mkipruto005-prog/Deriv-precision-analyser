import React from 'react';
import { TickData, DerivSymbol } from '../types';
import { Zap, ShieldCheck, Flame, Hash, Activity } from 'lucide-react';

interface DigitWormTapeProps {
  ticks: TickData[];
  symbol?: DerivSymbol;
  maxVisible?: number;
  onSelectDigit?: (digit: number) => void;
  onTradeDiffers?: (digit: number) => void;
  onTradeUnder8?: (ticks: number, stake: number) => void;
}

export const DigitWormTape: React.FC<DigitWormTapeProps> = ({
  ticks,
  symbol,
  maxVisible = 28,
  onSelectDigit,
  onTradeDiffers,
  onTradeUnder8
}) => {
  const displayTicks = ticks.slice(-maxVisible);
  const pipSize = symbol?.pipSize ?? 2;
  const currentDigit = displayTicks.length > 0 ? displayTicks[displayTicks.length - 1].lastDigit : null;

  // Compute streak statistics
  let safeStreak = 0;
  for (let i = displayTicks.length - 1; i >= 0; i--) {
    if (displayTicks[i].lastDigit < 8) safeStreak++;
    else break;
  }

  let evenStreak = 0;
  let oddStreak = 0;
  if (currentDigit !== null) {
    const isEven = currentDigit % 2 === 0;
    for (let i = displayTicks.length - 1; i >= 0; i--) {
      if ((displayTicks[i].lastDigit % 2 === 0) === isEven) {
        if (isEven) evenStreak++;
        else oddStreak++;
      } else break;
    }
  }

  const safeCount = displayTicks.filter(t => t.lastDigit < 8).length;
  const safeRatio = displayTicks.length > 0 ? (safeCount / displayTicks.length) * 100 : 80;

  return (
    <div id="digit-worm-tape" className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-white uppercase tracking-wider">
            Live Digit Worm &amp; Micro-Streak Tape
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            Last {displayTicks.length} Ticks
          </span>
        </div>

        {/* Live Streaks & Safe Ratio */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Under 8 Ratio:</span>
            <span className={`font-bold ${safeRatio >= 85 ? 'text-emerald-400' : 'text-slate-200'}`}>
              {safeRatio.toFixed(0)}%
            </span>
          </div>
          {safeStreak >= 3 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold animate-pulse">
              <ShieldCheck className="w-3 h-3" />
              <span>{safeStreak}x &lt;8 Streak</span>
            </div>
          )}
          {evenStreak >= 3 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
              <span>{evenStreak}x Even Streak</span>
            </div>
          )}
          {oddStreak >= 3 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
              <span>{oddStreak}x Odd Streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Worm Tape Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {displayTicks.length === 0 ? (
          <div className="text-xs text-slate-500 font-mono py-2">
            Streaming incoming market ticks...
          </div>
        ) : (
          displayTicks.map((tick, idx) => {
            const isLatest = idx === displayTicks.length - 1;
            const isSafe = tick.lastDigit < 8;
            const isEven = tick.lastDigit % 2 === 0;

            return (
              <div
                key={`${tick.epoch}-${idx}`}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                onClick={() => {
                  onSelectDigit?.(tick.lastDigit);
                  onTradeDiffers?.(tick.lastDigit);
                }}
                title={`Quote: ${tick.quote.toFixed(pipSize)} | Digit: ${tick.lastDigit} (Click to strike Differ)`}
              >
                <div
                  className={`w-7 h-8 sm:w-8 sm:h-9 rounded-lg flex flex-col items-center justify-center font-mono font-bold text-xs transition-all relative group-hover:scale-105 ${
                    isLatest
                      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg shadow-emerald-500/30 font-black'
                      : ''
                  } ${
                    isSafe
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/70 border border-rose-500/60 text-rose-300'
                  }`}
                >
                  <span>{tick.lastDigit}</span>
                  <span className={`text-[8px] leading-none ${isEven ? 'text-cyan-400' : 'text-purple-400'}`}>
                    {isEven ? 'E' : 'O'}
                  </span>
                </div>
                {isLatest && (
                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase animate-pulse">
                    NOW
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
