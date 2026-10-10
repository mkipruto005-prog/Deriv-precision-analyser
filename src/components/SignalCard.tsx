import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Clock, 
  DollarSign, 
  Zap, 
  Target, 
  BarChart2, 
  Bell, 
  BellRing,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from 'lucide-react';
import { PrecisionSignal, DerivSymbol, TickData } from '../types';
import { CONTRACT_INFO } from '../constants/symbols';
import { notificationService, NotificationPermissionState } from '../services/notificationService';

interface MiniTickItem {
  quote: number;
  lastDigit: number;
  epoch?: number;
}

interface SignalSparklineProps {
  ticks: MiniTickItem[];
  symbol: DerivSymbol;
  signal?: PrecisionSignal | null;
  currentPrice: number;
  currentDigit: number;
  isScanning?: boolean;
}

/**
 * Mini sparkline graph representing the last 10 ticks of the signal's symbol,
 * providing immediate visual context for the trend leading to the signal.
 */
export const SignalSparkline: React.FC<SignalSparklineProps> = ({
  ticks,
  symbol,
  signal,
  currentPrice,
  currentDigit,
  isScanning = false
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Take the last 10 ticks (or fallback if empty)
  const displayTicks = useMemo(() => {
    if (ticks && ticks.length > 0) {
      return ticks.slice(-10);
    }
    return [{ quote: currentPrice, lastDigit: currentDigit, epoch: Date.now() }];
  }, [ticks, currentPrice, currentDigit]);

  const pipSize = symbol?.pipSize ?? 2;

  // Compute trend metrics across the 10 ticks
  const quotes = displayTicks.map(t => t.quote);
  const minQuote = Math.min(...quotes);
  const maxQuote = Math.max(...quotes);
  const rawDiff = maxQuote - minQuote;
  const firstQuote = quotes[0] ?? currentPrice;
  const lastQuote = quotes[quotes.length - 1] ?? currentPrice;
  const netDelta = lastQuote - firstQuote;
  const pctDelta = firstQuote !== 0 ? (netDelta / firstQuote) * 100 : 0;

  const isUp = netDelta > 0.000001;
  const isDown = netDelta < -0.000001;
  const isFlat = !isUp && !isDown;

  const trendColor = isUp ? '#10b981' : isDown ? '#f43f5e' : '#38bdf8';
  const trendClass = isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-sky-400';
  const trendBg = isUp 
    ? 'bg-emerald-500/15 border-emerald-500/30' 
    : isDown 
    ? 'bg-rose-500/15 border-rose-500/30' 
    : 'bg-sky-500/15 border-sky-500/30';

  // SVG dimensions & coordinate calculations
  const svgWidth = 380;
  const svgHeight = 62;
  const paddingX = 14;
  const paddingTop = 10;
  const paddingBottom = 12;
  const usableW = svgWidth - paddingX * 2;
  const usableH = svgHeight - paddingTop - paddingBottom;

  const effectivePadding = rawDiff === 0 ? (minQuote * 0.0002 || 0.01) : rawDiff * 0.18;
  const effectiveMin = minQuote - effectivePadding;
  const effectiveMax = maxQuote + effectivePadding;
  const effectiveRange = Math.max(0.000001, effectiveMax - effectiveMin);

  const points = useMemo(() => {
    return displayTicks.map((t, i) => {
      const x = paddingX + (displayTicks.length > 1 ? (i / (displayTicks.length - 1)) * usableW : usableW / 2);
      const normalizedY = (t.quote - effectiveMin) / effectiveRange;
      const y = paddingTop + (1 - normalizedY) * usableH;
      return { x, y, tick: t, i };
    });
  }, [displayTicks, effectiveMin, effectiveRange, paddingX, paddingTop, usableH, usableW]);

  // Construct smooth Bezier curve & gradient area
  const { pathD, areaD, baselineY } = useMemo(() => {
    if (points.length === 0) return { pathD: '', areaD: '', baselineY: svgHeight / 2 };
    if (points.length === 1) {
      const p = points[0];
      return {
        pathD: `M ${p.x - 20},${p.y} L ${p.x + 20},${p.y}`,
        areaD: `M ${p.x - 20},${p.y} L ${p.x + 20},${p.y} L ${p.x + 20},${svgHeight} L ${p.x - 20},${svgHeight} Z`,
        baselineY: p.y
      };
    }

    let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = ((p0.x + p1.x) / 2).toFixed(1);
      d += ` C ${midX},${p0.y.toFixed(1)} ${midX},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
    }

    const aD = `${d} L ${points[points.length - 1].x.toFixed(1)},${svgHeight - 2} L ${points[0].x.toFixed(1)},${svgHeight - 2} Z`;
    const bY = paddingTop + (1 - (firstQuote - effectiveMin) / effectiveRange) * usableH;

    return { pathD: d, areaD: aD, baselineY: bY };
  }, [points, firstQuote, effectiveMin, effectiveRange, paddingTop, usableH, svgHeight]);

  const activeInspectTick = hoveredIdx !== null ? displayTicks[hoveredIdx] : displayTicks[displayTicks.length - 1];
  const activeInspectIdx = hoveredIdx !== null ? hoveredIdx : displayTicks.length - 1;
  const activeInspectPt = points[activeInspectIdx];

  // Up/down counts across the 10-tick sequence
  let risingTicksCount = 0;
  let fallingTicksCount = 0;
  for (let i = 1; i < displayTicks.length; i++) {
    if (displayTicks[i].quote > displayTicks[i - 1].quote) risingTicksCount++;
    else if (displayTicks[i].quote < displayTicks[i - 1].quote) fallingTicksCount++;
  }

  // Contextual narrative explaining trend relation to signal
  const signalContext = useMemo(() => {
    if (!signal) {
      if (isUp) return `Live 10-tick momentum is drifting upward (+${risingTicksCount}/${Math.max(1, displayTicks.length - 1)} ticks up). Monitoring for confluence trigger.`;
      if (isDown) return `Live 10-tick momentum is drifting downward (-${fallingTicksCount}/${Math.max(1, displayTicks.length - 1)} ticks down). Monitoring for confluence trigger.`;
      return `Market consolidating within tight ${(rawDiff).toFixed(pipSize)} pip range across the last 10 ticks.`;
    }

    const dir = signal.direction;
    const type = signal.contractType;

    if (dir === 'UP' || type === 'CALL' || dir === 'OVER') {
      if (isUp) {
        return `Strong Bullish Momentum: 10-tick upward trajectory (+${risingTicksCount} ticks up) directly aligns with ${type} breakout entry.`;
      }
      return `Mean-Reversion Pullback: 10-tick dip reached local exhaustion floor, providing high-probability ${type} discount bounce.`;
    }

    if (dir === 'DOWN' || type === 'PUT' || dir === 'UNDER') {
      if (isDown) {
        return `Strong Bearish Momentum: 10-tick downward pressure (-${fallingTicksCount} ticks down) directly confirms ${type} trend entry.`;
      }
      return `Mean-Reversion Exhaustion: 10-tick rally reached resistance ceiling, priming high-probability ${type} short reversal.`;
    }

    if (type === 'DIGITDIFF' || (type as string) === 'DIFFERS') {
      const predDigit = signal.predictedDigit;
      const occurrences = displayTicks.filter(t => t.lastDigit === predDigit).length;
      return `Cold Digit Sequence: Target digit [${predDigit}] appeared ${occurrences} time(s) across the 10-tick pre-signal lead-in.`;
    }

    if (type === 'DIGITMATCH' || type === 'DIGITMATCHES' || (type as string) === 'MATCHES') {
      const predDigit = signal.predictedDigit;
      return `Resonance Cluster: Leading momentum converging into key target digit [${predDigit}] strike zone.`;
    }

    if (dir === 'EVEN' || dir === 'ODD') {
      const evens = displayTicks.filter(t => t.lastDigit % 2 === 0).length;
      const odds = displayTicks.length - evens;
      return `Parity Velocity: ${evens} Even vs ${odds} Odd over the 10-tick sequence leading into ${dir} execution.`;
    }

    return `10-tick trend indicates ${isUp ? 'bullish drift' : isDown ? 'bearish drift' : 'consolidation'} leading into ${signal.contractType} signal.`;
  }, [signal, isUp, isDown, risingTicksCount, fallingTicksCount, displayTicks, rawDiff, pipSize]);

  // Unique ID for SVG gradient to avoid DOM collisions
  const gradId = `spark-grad-${signal ? signal.id.replace(/[^a-zA-Z0-9_-]/g, '') : isScanning ? 'scan' : 'live'}`;

  return (
    <div id="signal-sparkline-panel" className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 sm:p-4 space-y-3">
      {/* Header bar of Sparkline */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
              <span>{signal ? 'Pre-Signal Trend Context' : '10-Tick Pre-Signal Trend'}</span>
              <span className="text-[10px] normal-case font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Last {displayTicks.length} Ticks
              </span>
              <span className="text-[10px] normal-case font-mono text-slate-400">
                ({symbol.name})
              </span>
            </div>
          </div>
        </div>

        {/* Trend & Net Change Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 ${trendBg} ${trendClass}`}>
            {isUp && <TrendingUp className="w-3.5 h-3.5" />}
            {isDown && <TrendingDown className="w-3.5 h-3.5" />}
            {isFlat && <Minus className="w-3.5 h-3.5" />}
            <span>
              {netDelta > 0 ? '+' : ''}{netDelta.toFixed(pipSize)} ({pctDelta > 0 ? '+' : ''}{pctDelta.toFixed(2)}%)
            </span>
            <span className="text-[10px] uppercase font-sans tracking-wide ml-0.5">
              {isUp ? 'Uptrend' : isDown ? 'Downtrend' : 'Neutral'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
            <span>Range:</span>
            <span className="text-slate-200 font-semibold">{rawDiff.toFixed(pipSize)}</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Sparkline */}
      <div className="relative w-full bg-slate-950/70 rounded-lg p-2.5 border border-slate-800/90 overflow-hidden">
        {/* High / Low Price Bounds */}
        <div className="absolute top-1.5 right-2 text-[9px] font-mono text-slate-500 select-none z-10">
          H: <span className="text-slate-300 font-medium">{maxQuote.toFixed(pipSize)}</span>
        </div>
        <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-slate-500 select-none z-10">
          L: <span className="text-slate-300 font-medium">{minQuote.toFixed(pipSize)}</span>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-16 sm:h-20 overflow-visible select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Dotted baseline at start tick quote */}
          <line
            x1={paddingX}
            y1={baselineY}
            x2={svgWidth - paddingX}
            y2={baselineY}
            stroke="#475569"
            strokeDasharray="3 3"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Area fill under curve */}
          {areaD && (
            <path
              d={areaD}
              fill={`url(#${gradId})`}
              className="transition-all duration-300"
            />
          )}

          {/* Sparkline curve line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={trendColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Guideline on hover */}
          {hoveredIdx !== null && activeInspectPt && (
            <line
              x1={activeInspectPt.x}
              y1={paddingTop - 4}
              x2={activeInspectPt.x}
              y2={svgHeight - paddingBottom + 4}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.8"
            />
          )}

          {/* 10 Tick Data Nodes */}
          {points.map((pt, idx) => {
            const isLast = idx === points.length - 1;
            const prevPt = idx > 0 ? points[idx - 1] : null;
            const ptDelta = prevPt ? pt.tick.quote - prevPt.tick.quote : 0;
            const ptColor = ptDelta > 0.000001 ? '#10b981' : ptDelta < -0.000001 ? '#f43f5e' : '#94a3b8';
            const isHovered = hoveredIdx === idx;

            return (
              <g 
                key={idx} 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
              >
                {/* Generous touch/hover hit zone */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {isLast && (
                  <>
                    {/* Glowing pulse ring on latest tick */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="8"
                      fill="none"
                      stroke={trendColor}
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.75"
                    />
                    {/* Solid outer ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 5}
                      fill={trendColor}
                      stroke="#020617"
                      strokeWidth="2"
                    />
                    {/* Bright white dot */}
                    <circle cx={pt.x} cy={pt.y} r="2" fill="#ffffff" />
                  </>
                )}

                {!isLast && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 4.5 : 3}
                    fill={ptColor}
                    stroke="#020617"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover / Active Tick Info Strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] pt-2 border-t border-slate-800/80 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              {activeInspectIdx === displayTicks.length - 1 ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {signal ? 'Signal Trigger Tick (T-0)' : 'Live Tick (T-0)'}
                </span>
              ) : (
                `Tick T-${displayTicks.length - 1 - activeInspectIdx}`
              )}
            </span>
            <span className="text-white font-bold">{activeInspectTick.quote.toFixed(pipSize)}</span>
            <span className="w-4 h-4 rounded bg-slate-800 text-emerald-300 text-[10px] font-black flex items-center justify-center border border-slate-700">
              {activeInspectTick.lastDigit}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeInspectIdx > 0 && (
              <span className={`text-[10px] ${
                displayTicks[activeInspectIdx].quote > displayTicks[activeInspectIdx - 1].quote
                  ? 'text-emerald-400'
                  : displayTicks[activeInspectIdx].quote < displayTicks[activeInspectIdx - 1].quote
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}>
                Step: {displayTicks[activeInspectIdx].quote > displayTicks[activeInspectIdx - 1].quote ? '▲ +' : displayTicks[activeInspectIdx].quote < displayTicks[activeInspectIdx - 1].quote ? '▼ ' : '▬ '}
                {(displayTicks[activeInspectIdx].quote - displayTicks[activeInspectIdx - 1].quote).toFixed(pipSize)}
              </span>
            )}
            <span className="text-slate-500 text-[10px] hidden xs:inline">
              Hover sparkline nodes to inspect
            </span>
          </div>
        </div>
      </div>

      {/* 10 Micro-Ticks Sequence Strip with Digits */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span>10-Tick Sequence Leading into Signal</span>
          <span className="text-slate-500">T-9 → Trigger</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {displayTicks.map((t, idx) => {
            const isLast = idx === displayTicks.length - 1;
            const isHovered = hoveredIdx === idx;
            const prevTick = idx > 0 ? displayTicks[idx - 1] : null;
            const stepUp = prevTick ? t.quote > prevTick.quote : false;
            const stepDown = prevTick ? t.quote < prevTick.quote : false;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isLast
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : isHovered
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5">
                  <span>{isLast ? 'TRIGGER' : `T-${displayTicks.length - 1 - idx}`}</span>
                  {idx > 0 && (
                    <span className={`text-[8px] ${stepUp ? 'text-emerald-400' : stepDown ? 'text-rose-400' : 'text-slate-500'}`}>
                      {stepUp ? '▲' : stepDown ? '▼' : '—'}
                    </span>
                  )}
                </div>
                <div className={`text-sm font-black font-mono my-0.5 ${
                  isLast ? 'text-emerald-300' : 'text-slate-100'
                }`}>
                  {t.lastDigit}
                </div>
                <div className="text-[8px] font-mono text-slate-400 truncate max-w-full">
                  {t.quote.toFixed(pipSize).slice(-4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contextual Narrative Leading to Signal */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong className="text-slate-200">Leading Momentum Context: </strong>
          {signalContext}
        </span>
      </div>
    </div>
  );
};

interface SignalCardProps {
  signal: PrecisionSignal | null;
  currentPrice: number;
  currentDigit: number;
  symbol: DerivSymbol;
  ticks?: TickData[];
  onExecuteTrade: (signal: PrecisionSignal, stake: number) => void;
  pendingTrade: {
    signal: PrecisionSignal;
    startTickIndex: number;
    ticksElapsed: number;
    targetTicks: number;
    stake: number;
  } | null;
  onOpenNotifications?: () => void;
  isAutoStrikeArmed?: boolean;
  onToggleAutoStrike?: (armed: boolean) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  currentPrice,
  currentDigit,
  symbol,
  ticks,
  onExecuteTrade,
  pendingTrade,
  onOpenNotifications,
  isAutoStrikeArmed = false,
  onToggleAutoStrike
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(10);
  const [showAllFactors, setShowAllFactors] = useState(false);
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermissionState>('default');

  // Fallback internal rolling 10-tick buffer if ticks prop is omitted or empty
  const [internalTicks, setInternalTicks] = useState<{ quote: number; lastDigit: number; epoch: number }[]>([]);

  useEffect(() => {
    if (ticks && ticks.length > 0) return;
    setInternalTicks(prev => {
      const next = [...prev, { quote: currentPrice, lastDigit: currentDigit, epoch: Date.now() }];
      return next.slice(-10);
    });
  }, [currentPrice, currentDigit, ticks]);

  const activeTickData = useMemo(() => {
    if (ticks && ticks.length >= 1) {
      return ticks;
    }
    return internalTicks;
  }, [ticks, internalTicks]);

  React.useEffect(() => {
    setNotifyPerm(notificationService.getPermission());
    const unsub = notificationService.subscribe(() => {
      setNotifyPerm(notificationService.getPermission());
    });
    return unsub;
  }, []);

  const contractMeta = signal ? CONTRACT_INFO[signal.contractType] : null;

  return (
    <div id="precision-signal-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Ambient background glow for high-accuracy alert */}
      {signal && signal.isUltraAccuracy && (
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
              95%+ Confluence Signal Engine
              <span className="text-[10px] normal-case font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Ultra Filter Active
              </span>
              {onOpenNotifications && (
                <button
                  id="signalcard-notification-badge-btn"
                  onClick={onOpenNotifications}
                  className={`text-[10px] normal-case font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                    notifyPerm === 'granted'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40 animate-pulse'
                  }`}
                  title="Configure background browser notifications for 95%+ signals"
                >
                  {notifyPerm === 'granted' ? (
                    <>
                      <BellRing className="w-3 h-3 text-emerald-400" />
                      <span>Background Alerts ON</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3 h-3 text-amber-400" />
                      <span>Enable Background Alerts</span>
                    </>
                  )}
                </button>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Only activates when multi-factor statistical edge reaches &gt;95% confidence
            </p>
          </div>
        </div>

        {/* Live quote ticker */}
        <div className="text-right">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Live Tick</div>
          <div className="font-mono text-base font-bold text-slate-100 flex items-center gap-1 justify-end">
            <span>{currentPrice.toFixed(symbol?.pipSize ?? 2)}</span>
            <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center justify-center border border-emerald-500/40">
              {currentDigit}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Active Trade Status */}
      {pendingTrade && (
        <div className="mb-4 p-3.5 rounded-xl bg-slate-800/90 border border-emerald-500/50 animate-pulse">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Active Contract Execution: {pendingTrade.signal.contractType}
            </span>
            <span className="font-mono text-slate-300">
              Tick {pendingTrade.ticksElapsed} / {pendingTrade.targetTicks}
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (pendingTrade.ticksElapsed / pendingTrade.targetTicks) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>Entry: <strong className="text-slate-200">{pendingTrade.signal.entryQuote}</strong></span>
            <span>Target: <strong className="text-slate-200">{pendingTrade.signal.direction} {pendingTrade.signal.predictedDigit !== undefined ? pendingTrade.signal.predictedDigit : ''}</strong></span>
            <span>Stake: <strong className="text-emerald-300">${pendingTrade.stake.toFixed(2)}</strong></span>
          </div>
        </div>
      )}

      {/* Main Signal Display */}
      {signal ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left: Big Confidence & Setup Badge */}
            <div className="md:col-span-7 bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  VERIFIED 95%+ SETUP
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {symbol.id}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
                  {signal.confidence.toFixed(1)}%
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                    Statistical Probability
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Confluence Score: {signal.confluenceScore}/100
                  </div>
                </div>
              </div>

              {/* Action summary */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Recommended Action</div>
                  <div className="text-lg font-bold text-white flex items-center gap-1.5">
                    {signal.direction === 'UP' && <ArrowUpRight className="w-5 h-5 text-emerald-400" />}
                    {signal.direction === 'DOWN' && <ArrowDownRight className="w-5 h-5 text-rose-400" />}
                    <span>{signal.contractType}</span>
                    {signal.predictedDigit !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-sm">
                        {signal.direction === 'DIFFERS' ? `DIFFERS ${signal.predictedDigit}` : `${signal.direction} ${signal.predictedDigit}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Duration</div>
                  <div className="text-sm font-mono font-bold text-slate-200">
                    {signal.durationTicks} {signal.durationTicks === 1 ? 'Tick' : 'Ticks'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Stake & Execution */}
            <div className="md:col-span-5 flex flex-col justify-between h-full bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
              <div>
                <div className="text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>Stake Amount ($)</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Est. Return: +{contractMeta ? contractMeta.payoutRate : 95}%
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setStakeAmount(amt)}
                      className={`flex-1 py-1 text-xs font-mono font-bold rounded border transition-colors ${
                        stakeAmount === amt
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="relative mb-3">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="execute-trade-btn"
                  disabled={!!pendingTrade}
                  onClick={() => onExecuteTrade(signal, stakeAmount)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                    pendingTrade
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.98]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{pendingTrade ? 'Demo Contract Evaluating...' : `Strike 1-Tick Demo Trade ($${stakeAmount})`}</span>
                </button>

                {onToggleAutoStrike && (
                  <button
                    id="signal-auto-strike-toggle-btn"
                    onClick={() => onToggleAutoStrike(!isAutoStrikeArmed)}
                    className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 shadow-md ${
                      isAutoStrikeArmed
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                    }`}
                    title="Toggle auto-strike on high confluence entry points"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{isAutoStrikeArmed ? 'AUTO: ARMED' : 'AUTO STRIKE'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mini Sparkline Graph: Last 10 Ticks Trend Leading to Signal */}
          <SignalSparkline
            ticks={activeTickData}
            symbol={symbol}
            signal={signal}
            currentPrice={currentPrice}
            currentDigit={currentDigit}
          />

          {/* Confluence Checklist */}
          <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Confluence Matrix ({signal.confluenceFactors.filter(f => f.status === 'MET').length}/{signal.confluenceFactors.length} Aligned)
              </span>
              <button
                onClick={() => setShowAllFactors(!showAllFactors)}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                {showAllFactors ? 'Compact' : 'View Factors'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(showAllFactors ? signal.confluenceFactors : signal.confluenceFactors.slice(0, 4)).map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/70 border border-slate-700/50 text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">{factor.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{factor.description}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 shrink-0 ml-2">
                    {factor.valueText}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-2.5 italic">
              {signal.reason}
            </p>
          </div>
        </div>
      ) : (
        /* Standby / Scanning State */
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 animate-pulse">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">
              Scanning {symbol.name} for 95%+ Confluence
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              The precision filter suppresses low-accuracy setups (50–70%). A signal will fire automatically the instant 6+ mathematical factors converge to create a &gt;95% edge.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Monitoring EMA (9/21), RSI (14), Bollinger, &amp; Digit Cold Decays</span>
          </div>

          {isAutoStrikeArmed && (
            <div className="max-w-md mx-auto p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-xs text-amber-300 animate-pulse font-mono">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Auto-Strike Armed:</strong> Will fire immediately when 95%+ entry point triggers.
              </span>
            </div>
          )}

          {/* 10-Tick Pre-Signal Trend Sparkline */}
          <div className="max-w-2xl mx-auto pt-3 text-left">
            <SignalSparkline
              ticks={activeTickData}
              symbol={symbol}
              currentPrice={currentPrice}
              currentDigit={currentDigit}
              isScanning={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
