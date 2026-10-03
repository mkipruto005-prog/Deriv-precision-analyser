import React, { useRef, useEffect, useState } from 'react';
import { 
  TickData, 
  IndicatorValues, 
  DerivSymbol, 
  TradeRecord 
} from '../types';
import { 
  calculateEMA, 
  calculateBollingerBands 
} from '../services/technicalAnalysis';
import { Eye, EyeOff, Layers, Maximize2, BarChart } from 'lucide-react';

interface TradingChartProps {
  ticks: TickData[];
  indicators: IndicatorValues;
  symbol: DerivSymbol;
  trades: TradeRecord[];
}

export const TradingChart: React.FC<TradingChartProps> = ({
  ticks,
  indicators,
  symbol,
  trades
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showEMA, setShowEMA] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showDigits, setShowDigits] = useState(true);
  const [density, setDensity] = useState<40 | 80 | 150 | 250>(80);
  const [hoveredTick, setHoveredTick] = useState<TickData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Resize canvas according to container
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (ticks.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating Deriv ticks...', width / 2, height / 2);
      ctx.restore();
      return;
    }

    // Window of ticks to display (based on density)
    const displayTicks = ticks.slice(-density);
    const prices = displayTicks.map(t => t.quote);

    // Compute indicators for this slice
    const allPrices = ticks.map(t => t.quote);
    const ema9All = calculateEMA(allPrices, 9);
    const ema21All = calculateEMA(allPrices, 21);
    const bbAll = calculateBollingerBands(allPrices, 20, 2);

    const startIndex = Math.max(0, ticks.length - density);
    const ema9Slice = ema9All.slice(startIndex);
    const ema21Slice = ema21All.slice(startIndex);
    const bbUpperSlice = bbAll.upper.slice(startIndex);
    const bbLowerSlice = bbAll.lower.slice(startIndex);
    const bbMiddleSlice = bbAll.middle.slice(startIndex);

    // Determine min/max price for Y scale
    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);

    if (showBollinger) {
      bbLowerSlice.forEach(v => { if (v !== null) minPrice = Math.min(minPrice, v); });
      bbUpperSlice.forEach(v => { if (v !== null) maxPrice = Math.max(maxPrice, v); });
    }

    const paddingY = (maxPrice - minPrice) * 0.1 || 0.001;
    minPrice -= paddingY;
    maxPrice += paddingY;
    const priceRange = maxPrice - minPrice;

    // Layout margins
    const paddingLeft = 16;
    const paddingRight = 75; // for price axis
    const paddingTop = 25;
    const paddingBottom = 30;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const getX = (index: number) => paddingLeft + (index / (displayTicks.length - 1)) * plotWidth;
    const getY = (price: number) => paddingTop + plotHeight - ((price - minPrice) / priceRange) * plotHeight;

    // 1. Grid lines & Price scale
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const p = minPrice + (i / numGridLines) * priceRange;
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Right axis label
      ctx.setLineDash([]);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(symbol?.pipSize ?? 2), width - paddingRight + 8, y + 3);
      ctx.setLineDash([4, 4]);
    }
    ctx.setLineDash([]);

    // 2. Bollinger Bands Envelope
    if (showBollinger && bbUpperSlice.length > 0) {
      // Shaded band
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < displayTicks.length; i++) {
        const u = bbUpperSlice[i];
        if (u !== null) {
          const x = getX(i);
          const y = getY(u);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = displayTicks.length - 1; i >= 0; i--) {
        const l = bbLowerSlice[i];
        if (l !== null) {
          const x = getX(i);
          const y = getY(l);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(139, 92, 246, 0.06)';
      ctx.fill();

      // Upper & lower lines
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      for (let i = 0; i < displayTicks.length; i++) {
        const u = bbUpperSlice[i];
        if (u !== null) {
          const x = getX(i);
          const y = getY(u);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < displayTicks.length; i++) {
        const l = bbLowerSlice[i];
        if (l !== null) {
          const x = getX(i);
          const y = getY(l);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Moving Averages
    if (showEMA) {
      // EMA 21 (Amber)
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      let started21 = false;
      for (let i = 0; i < displayTicks.length; i++) {
        const val = ema21Slice[i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started21) {
            ctx.moveTo(x, y);
            started21 = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // EMA 9 (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      let started9 = false;
      for (let i = 0; i < displayTicks.length; i++) {
        const val = ema9Slice[i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started9) {
            ctx.moveTo(x, y);
            started9 = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // 4. Main Price Line with Gradient Fill
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(prices[0]));
    for (let i = 1; i < displayTicks.length; i++) {
      ctx.lineTo(getX(i), getY(prices[i]));
    }

    // Fill under price line
    const lastX = getX(displayTicks.length - 1);
    ctx.lineTo(lastX, paddingTop + plotHeight);
    ctx.lineTo(getX(0), paddingTop + plotHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotHeight);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Price stroke
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(prices[0]));
    for (let i = 1; i < displayTicks.length; i++) {
      ctx.lineTo(getX(i), getY(prices[i]));
    }
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 5. Individual Tick Markers & Digit Pins
    for (let i = 0; i < displayTicks.length; i++) {
      const x = getX(i);
      const y = getY(prices[i]);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#064e3b';
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Render digit pin above vertex if enabled and reasonable density
      if (showDigits && density <= 150) {
        const digit = displayTicks[i].lastDigit;
        const isSafe = digit < 8;
        ctx.fillStyle = isSafe ? '#34d399' : '#fb7185';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        // Alternate slightly if dense to prevent overlap
        const yOffset = (i % 2 === 0 && density > 60) ? -12 : -6;
        ctx.fillText(String(digit), x, y + yOffset);
      }
    }

    // 6. Recent Trade Markers (WIN / LOSS arrows)
    trades.slice(-5).forEach(trade => {
      // Find matching tick by timestamp
      const matchIdx = displayTicks.findIndex(t => Math.abs(t.epoch - trade.timestamp) < 5);
      if (matchIdx !== -1) {
        const x = getX(matchIdx);
        const y = getY(trade.entryQuote);

        ctx.fillStyle = trade.outcome === 'WIN' ? '#10b981' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(x, y - 12, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(trade.outcome === 'WIN' ? 'W' : 'L', x, y - 9);
      }
    });

    // 7. Current Price Horizontal Line & Live Callout
    const latestTick = displayTicks[displayTicks.length - 1];
    const latestPrice = latestTick.quote;
    const latestY = getY(latestPrice);

    // Horizontal dashed line
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.moveTo(paddingLeft, latestY);
    ctx.lineTo(width - paddingRight, latestY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live pulsing dot
    ctx.beginPath();
    ctx.arc(lastX, latestY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#ecfdf5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Price badge on right axis
    const badgeWidth = 68;
    const badgeHeight = 20;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(width - paddingRight + 4, latestY - badgeHeight / 2, badgeWidth, badgeHeight, 4);
    ctx.fill();

    ctx.fillStyle = '#022c22';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(latestPrice.toFixed(symbol?.pipSize ?? 2), width - paddingRight + 8, latestY + 4);

    // 8. Time labels on bottom
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < displayTicks.length; i += 15) {
      const t = displayTicks[i];
      const date = new Date(t.epoch * 1000);
      const timeStr = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      ctx.fillText(timeStr, getX(i), height - 8);
    }

    ctx.restore();
  }, [ticks, showEMA, showBollinger, showDigits, density, symbol, trades]);

  return (
    <div 
      id="chart-container" 
      ref={containerRef} 
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[380px] relative overflow-hidden"
    >
      {/* Top Chart Header & Indicator Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white uppercase">{symbol.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              Live Stream
            </span>
          </div>

          {/* Quick legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-0.5 bg-emerald-400 rounded-full" /> Price
            </span>
            {showEMA && (
              <>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-0.5 bg-cyan-400 rounded-full" /> EMA 9
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-0.5 bg-amber-400 rounded-full" /> EMA 21
                </span>
              </>
            )}
            {showBollinger && (
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-0.5 bg-purple-400 rounded-full" /> BB (20,2)
              </span>
            )}
          </div>
        </div>

        {/* Indicator & Density Controls */}
        <div className="flex items-center gap-2">
          {/* Tick Density Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-[10px] font-mono">
            {([40, 80, 150, 250] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  density === d
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}t
              </button>
            ))}
          </div>

          {/* Digit Pins & Indicators */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setShowDigits(!showDigits)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold transition-colors ${
                showDigits 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show last digit overlay above each tick"
            >
              Digits
            </button>
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold transition-colors ${
                showEMA 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EMA
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold transition-colors ${
                showBollinger 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BB
            </button>
          </div>
        </div>
      </div>

      {/* Main HTML5 Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[280px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
};
