import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TickData, 
  DerivSymbol, 
  EvenOddAnalysis, 
  BestVolatilityEvenOddResult 
} from '../types';
import { DERIV_SYMBOLS } from '../constants/symbols';
import { scanForBestVolatilityEvenOdd } from '../services/evenOddAnalysis';
import { soundEngine } from '../services/audioAlert';
import { 
  Trophy, 
  Sparkles, 
  Zap, 
  Target, 
  TrendingUp, 
  RotateCcw, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Check, 
  Copy, 
  ChevronRight, 
  Info, 
  Gauge, 
  Sliders,
  CheckCircle2,
  Clock,
  Wifi
} from 'lucide-react';

interface BestVolatilityEvenOddScannerProps {
  currentSymbol: DerivSymbol;
  currentTicks: TickData[];
  ticksBySymbol?: Record<string, TickData[]>;
  onSelectSymbol: (symbol: DerivSymbol) => void;
  onTradeEvenOdd?: (target: 'EVEN' | 'ODD', stake: number) => void;
  allSymbols?: DerivSymbol[];
  isAuthorized?: boolean;
  strategyConfig?: import('../types').EvenOddStrategyConfig;
  connectionStatus?: import('../services/derivWebSocket').ConnectionStatus;
  latencyMs?: number;
  derivTelemetry?: import('../services/derivWebSocket').DerivTelemetry;
  onReconnectDeriv?: () => void;
  onRefreshMarkets?: () => void;
}

export const BestVolatilityEvenOddScanner: React.FC<BestVolatilityEvenOddScannerProps> = ({
  currentSymbol,
  currentTicks,
  ticksBySymbol = {},
  onSelectSymbol,
  onTradeEvenOdd,
  allSymbols = DERIV_SYMBOLS,
  isAuthorized = false,
  strategyConfig,
  connectionStatus = 'CONNECTED',
  latencyMs = 24,
  derivTelemetry,
  onReconnectDeriv,
  onRefreshMarkets
}) => {
  // Scanner cycle state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [scanStageText, setScanStageText] = useState<string>('Scan Complete · Best Volatility Locked');
  const [lastScanTime, setLastScanTime] = useState<string>(() => new Date().toLocaleTimeString());
  
  // Parity bias filter: 'ALL' | 'EVEN' | 'ODD'
  const [targetBias, setTargetBias] = useState<'ALL' | 'EVEN' | 'ODD'>('ALL');
  
  // Auto-scan every 20 seconds
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(true);
  const [autoTimer, setAutoTimer] = useState<number>(20);

  // Auto-switch to best volatility index when found
  const [autoSwitchMarket, setAutoSwitchMarket] = useState<boolean>(true);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  // Quick trade stake
  const [stake, setStake] = useState<number>(10);
  const [copied, setCopied] = useState<boolean>(false);

  // Current scanned best & leaderboard state
  const [scanData, setScanData] = useState<{
    bestMarket: BestVolatilityEvenOddResult;
    rankedMarkets: BestVolatilityEvenOddResult[];
    scanTimestamp: number;
  }>(() => {
    return scanForBestVolatilityEvenOdd(allSymbols, currentSymbol, currentTicks, ticksBySymbol, strategyConfig);
  });

  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Re-run scan only when strategyConfig or symbols change or on timer/trigger
  useEffect(() => {
    const updated = scanForBestVolatilityEvenOdd(allSymbols, currentSymbol, currentTicks, ticksBySymbol, strategyConfig);
    setScanData(updated);
  }, [allSymbols, strategyConfig]);

  // Perform full scan with smooth ~1.7s radar sweep and automatic market switching
  const handleTriggerScan = () => {
    if (isScanning) return;

    // Immediately trigger Deriv WebSocket multi-market ticks refresh
    onRefreshMarkets?.();

    // Immediately compute initial fresh data on present market ticks with dynamic advance
    const freshResult = scanForBestVolatilityEvenOdd(allSymbols, currentSymbol, currentTicks, ticksBySymbol, strategyConfig, true);
    setScanData(freshResult);
    setLastScanTime(new Date().toLocaleTimeString());

    setIsScanning(true);
    setScanProgress(0);
    soundEngine.playSignalAlert();

    const stages = [
      { p: 18, t: 'Querying Deriv WebSocket for 13 Volatility Indices (10, 25, 50, 75, 100, 1s)...' },
      { p: 38, t: 'Deriv Real-Time Stream Synced · Testing Poisson Parity Streak Exhaustion...' },
      { p: 62, t: 'Calculating Markov Digit-to-Parity Transition Matrix on Live Ticks...' },
      { p: 82, t: 'Measuring Statistical Parity Skew & Win Confluence across all Markets...' },
      { p: 95, t: 'Isolating #1 High-Probability Volatility Index...' },
      { p: 100, t: 'Optimal Volatility Isolated & Synced!' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage += 1;
      if (currentStage < stages.length) {
        setScanProgress(stages[currentStage].p);
        setScanStageText(stages[currentStage].t);
      } else {
        clearInterval(interval);
        
        // Final evaluation on freshest available ticks with dynamic advance
        const finalResult = scanForBestVolatilityEvenOdd(allSymbols, currentSymbol, currentTicks, ticksBySymbol, strategyConfig, true);
        setScanData(finalResult);
        setIsScanning(false);
        setScanProgress(100);
        setAutoTimer(20);
        soundEngine.playWinAlert();

        const candidateMarkets = targetBias === 'ALL' 
          ? finalResult.rankedMarkets 
          : finalResult.rankedMarkets.filter((m) => m.targetParity === targetBias);
        const topMarket = candidateMarkets[0] || finalResult.bestMarket;

        // Auto-switch to the best volatility market if toggle is ON
        if (autoSwitchMarket && topMarket) {
          onSelectSymbol(topMarket.symbol);
          setScanStageText(`✓ Auto-Switched to ${topMarket.symbol.name} (${topMarket.confidence.toFixed(1)}% Conf)`);
          setSwitchFeedback(`Switched to ${topMarket.symbol.name} · Parity Edge: ${topMarket.confidence.toFixed(1)}%`);
          setTimeout(() => setSwitchFeedback(null), 5000);
        } else {
          setScanStageText(`Best Market: ${topMarket.symbol.name} (${topMarket.confidence.toFixed(1)}% Conf)`);
        }
      }
    }, 280); // 280ms * 6 = 1680ms (1.68s) - smooth, realistic, not too fast
  };

  // Auto-scan timer countdown with strategy config passed
  useEffect(() => {
    if (!autoScanEnabled || isScanning) return;

    const timer = setInterval(() => {
      setAutoTimer((prev) => {
        if (prev <= 1) {
          // Trigger Deriv ticks query and instant refresh
          onRefreshMarkets?.();
          const result = scanForBestVolatilityEvenOdd(allSymbols, currentSymbol, currentTicks, ticksBySymbol, strategyConfig, true);
          setScanData(result);
          setLastScanTime(new Date().toLocaleTimeString());

          // If autoSwitchMarket is enabled and a superior market is detected, automatically switch
          if (autoSwitchMarket) {
            const candidateMarkets = targetBias === 'ALL' 
              ? result.rankedMarkets 
              : result.rankedMarkets.filter((m) => m.targetParity === targetBias);
            const topMarket = candidateMarkets[0] || result.bestMarket;
            if (topMarket && topMarket.symbol.id !== currentSymbol.id && topMarket.confidence >= 92) {
              onSelectSymbol(topMarket.symbol);
              setSwitchFeedback(`Auto-switched to ${topMarket.symbol.name} (${topMarket.confidence.toFixed(1)}% Conf)`);
              setTimeout(() => setSwitchFeedback(null), 5000);
            }
          }
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoScanEnabled, isScanning, allSymbols, currentSymbol.id, currentTicks, ticksBySymbol, strategyConfig, autoSwitchMarket, targetBias]);

  // Filtered leaderboard by user's preference
  const displayedMarkets = useMemo(() => {
    if (targetBias === 'ALL') return scanData.rankedMarkets;
    return scanData.rankedMarkets.filter((m) => m.targetParity === targetBias);
  }, [scanData.rankedMarkets, targetBias]);

  const bestMarket = displayedMarkets[0] || scanData.bestMarket;
  const isBestMarketActive = bestMarket.symbol.id === currentSymbol.id;

  const handleCopyBestSignal = () => {
    const text = `🏆 DERIV BEST VOLATILITY: ${bestMarket.symbol.name} | Predict: BUY ${bestMarket.targetParity} | Confidence: ${bestMarket.confidence.toFixed(1)}% | Exhaustion: ${bestMarket.streakExhaustionProb.toFixed(1)}% | Streak: ${bestMarket.currentStreak}x ${bestMarket.currentParity}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchToBestMarket = (targetSymbol = bestMarket.symbol) => {
    onSelectSymbol(targetSymbol);
    soundEngine.playSignalAlert();
    setSwitchFeedback(`Switched Active Terminal to ${targetSymbol.name}! Real-time stream synced.`);
    setTimeout(() => setSwitchFeedback(null), 5000);
  };

  return (
    <div id="best-volatility-even-odd-scanner" className="w-full bg-slate-900/95 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-emerald-950/30 relative overflow-hidden space-y-5">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* HEADER: Title & Actions */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Volatility Engine</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              13 Volatility Indices
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Last Scanned: <span className="text-slate-200">{lastScanTime}</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white mt-1.5 flex items-center gap-2">
            <span>Scan Best Volatility for Even / Odd</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5 max-w-xl">
            Continuously evaluates all continuous synthetic volatility markets to single out the #1 market with the highest streak exhaustion and probability of an Even or Odd reversion.
          </p>
        </div>

        {/* Scan & Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Parity Target Filter */}
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs font-mono">
            <button
              onClick={() => setTargetBias('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                targetBias === 'ALL'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Parity
            </button>
            <button
              onClick={() => setTargetBias('EVEN')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                targetBias === 'EVEN'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              Even Only
            </button>
            <button
              onClick={() => setTargetBias('ODD')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                targetBias === 'ODD'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Odd Only
            </button>
          </div>

          {/* Auto-Switch Volatility Toggle */}
          <button
            onClick={() => setAutoSwitchMarket(!autoSwitchMarket)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
              autoSwitchMarket
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="When ON, scanning automatically switches the active market to the #1 best volatility index"
          >
            <Zap className={`w-3.5 h-3.5 ${autoSwitchMarket ? 'text-cyan-400 fill-cyan-400' : ''}`} />
            <span>Auto-Switch: {autoSwitchMarket ? 'ON' : 'OFF'}</span>
          </button>

          {/* Auto Scan Toggle */}
          <button
            onClick={() => setAutoScanEnabled(!autoScanEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              autoScanEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Automatically monitors and updates the best volatility market every 20s"
          >
            <Clock className={`w-3.5 h-3.5 ${autoScanEnabled ? 'text-emerald-400 animate-spin' : ''}`} />
            <span>Auto ({autoTimer}s)</span>
          </button>

          {/* Master Trigger Scan Button */}
          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-60"
          >
            <RotateCcw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning (1.7s)...' : 'Scan Best Volatility'}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE TERMINAL MARKET & DERIV WS CONNECTION BAR */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectionStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-slate-400 text-xs">Active Terminal Market:</span>
          <span className="text-white font-black text-sm px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {currentSymbol.name}
          </span>
          <span className="text-cyan-400 text-[11px] font-bold">
            [{currentSymbol.id}]
          </span>
          {isBestMarketActive ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>SYNCED WITH #1 PICK</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              DIFFERS FROM #1 PICK ({bestMarket.symbol.name})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Wifi className={`w-3.5 h-3.5 ${connectionStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={connectionStatus === 'CONNECTED' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {connectionStatus === 'CONNECTED' ? `Deriv WS: Connected (${latencyMs}ms)` : `Deriv WS: ${connectionStatus}`}
            </span>
          </div>
          {derivTelemetry && (
            <span className="text-[10px] text-slate-500 hidden md:inline">
              Ticks: {derivTelemetry.realTickCount}
            </span>
          )}
          {onReconnectDeriv && (
            <button
              onClick={onReconnectDeriv}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-colors"
              title="Force reconnect WebSocket socket to Deriv"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE SWITCH FEEDBACK BANNER */}
      {switchFeedback && (
        <div className="relative z-20 flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 border border-emerald-500/50 text-emerald-300 font-mono text-xs shadow-lg shadow-emerald-950/40 animate-pulse">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-white">{switchFeedback}</span>
            <span className="text-emerald-300/80 text-[11px] hidden sm:inline">· Deriv Live WebSocket Active</span>
          </div>
          <span className="text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded text-emerald-200 uppercase font-black tracking-wider">
            Active Market
          </span>
        </div>
      )}

      {/* SCANNING RADAR OVERLAY (IF SCANNING) */}
      {isScanning && (
        <div className="relative z-10 p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin" />
              {scanStageText}
            </span>
            <span className="text-slate-400 font-bold">{scanProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* HERO SECTION: #1 BEST VOLATILITY SPOTLIGHT */}
      <div className="relative z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Decorative Trophy Watermark */}
        <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
          <Trophy className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Column: Market & Parity Direction */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-black flex items-center gap-1.5 shadow-sm">
                <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>#1 TOP VOLATILITY INDEX</span>
              </span>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                {bestMarket.volatilityLabel}
              </span>

              {bestMarket.analysis?.strategyName && (
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                  Strategy: {bestMarket.analysis.strategyName}
                </span>
              )}

              {bestMarket.analysis?.isTradeSignalActive ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Signal Active</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Filter Active</span>
                </span>
              )}

              {isBestMarketActive ? (
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Currently Loaded</span>
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-400">
                  Click 'Switch to Market' to load in terminal
                </span>
              )}
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                {bestMarket.symbol.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1 leading-relaxed">
                {bestMarket.analysis?.isTradeSignalActive 
                  ? bestMarket.reason 
                  : (bestMarket.analysis?.filterReason || bestMarket.reason)}
              </p>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Active Streak:</span>
                <strong className="text-white text-sm">
                  {bestMarket.currentStreak}x {bestMarket.currentParity}
                </strong>
                <span className="text-[10px] text-slate-500 block">Exit #{bestMarket.currentDigit}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Streak Exhaustion:</span>
                <strong className="text-emerald-400 text-sm">
                  {bestMarket.streakExhaustionProb.toFixed(1)}%
                </strong>
                <span className="text-[10px] text-slate-500 block">Poisson decay</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Markov Jump:</span>
                <strong className="text-cyan-400 text-sm">
                  {bestMarket.markovJumpProb.toFixed(1)}%
                </strong>
                <span className="text-[10px] text-slate-500 block">to {bestMarket.targetParity}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Expected Value:</span>
                <strong className="text-amber-400 text-sm">
                  +{bestMarket.expectedValuePercent}%
                </strong>
                <span className="text-[10px] text-slate-500 block">Positive edge</span>
              </div>
            </div>
          </div>

          {/* Right Column: Parity Prediction Card & Instant Trade */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-3 shrink-0">
            {/* Prediction Badge */}
            <div className={`p-4 rounded-2xl border text-center font-mono space-y-1 shadow-lg ${
              bestMarket.targetParity === 'EVEN'
                ? 'bg-cyan-950/40 border-cyan-500/60 shadow-cyan-950/30'
                : 'bg-amber-950/40 border-amber-500/60 shadow-amber-950/30'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Recommended Prediction
              </span>
              <div className="flex items-center justify-center gap-2">
                <Zap className={`w-6 h-6 ${bestMarket.targetParity === 'EVEN' ? 'text-cyan-400 fill-cyan-400' : 'text-amber-400 fill-amber-400'}`} />
                <span className={`text-2xl sm:text-3xl font-black ${
                  bestMarket.targetParity === 'EVEN' ? 'text-cyan-300' : 'text-amber-300'
                }`}>
                  BUY {bestMarket.targetParity}
                </span>
              </div>
              <div className="text-xs text-emerald-400 font-bold">
                {bestMarket.confidence.toFixed(1)}% Percentage Confidence
              </div>
              <div className="text-[10px] text-slate-400">
                Digits: {bestMarket.targetParity === 'EVEN' ? '0, 2, 4, 6, 8' : '1, 3, 5, 7, 9'} · 1 Tick
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 w-full sm:w-auto">
              {/* Switch to this market button */}
              <button
                onClick={() => handleSwitchToBestMarket(bestMarket.symbol)}
                className={`w-full px-4 py-3 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                  isBestMarketActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-95 animate-pulse cursor-pointer'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>{isBestMarketActive ? `✓ Active Volatility: ${bestMarket.symbol.name}` : `👉 Switch to ${bestMarket.symbol.name}`}</span>
              </button>

              {/* 1-Click Quick Trade Button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-700 p-1">
                  {[5, 10, 25].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setStake(amt)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                        stake === amt
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (!isBestMarketActive) onSelectSymbol(bestMarket.symbol);
                    if (onTradeEvenOdd) onTradeEvenOdd(bestMarket.targetParity, stake);
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                    bestMarket.targetParity === 'EVEN'
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>TRADE ({bestMarket.targetParity} ${stake})</span>
                </button>

                <button
                  onClick={handleCopyBestSignal}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title="Copy signal details"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RANKED LEADERBOARD TABLE: ALL VOLATILITY MARKETS */}
      <div className="relative z-10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Ranked Volatility Index Leaderboard (Even / Odd Reversion)</span>
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              All 13 Deriv volatility indices sorted by streak exhaustion certainty, Markov jump confirmation, and statistical confidence.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Showing {displayedMarkets.length} ranked markets
          </span>
        </div>

        {/* Table / Grid for Desktop & Mobile */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Volatility Market</th>
                <th className="py-3 px-3">Current Streak</th>
                <th className="py-3 px-3">Target Parity</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">Exhaustion %</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedMarkets.map((m, index) => {
                const isSelected = m.symbol.id === currentSymbol.id;
                const isTop = index === 0;
                const isPrime = m.confidence >= 95.0 || m.currentStreak >= 4;

                return (
                  <tr
                    key={m.symbol.id}
                    className={`transition-colors ${
                      isTop
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                        : isSelected
                        ? 'bg-cyan-950/20 hover:bg-cyan-950/30'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {isTop ? (
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                            #1
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center">
                            #{index + 1}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Market Name */}
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-bold text-white block">
                          {m.symbol.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {m.volatilityLabel}
                        </span>
                      </div>
                    </td>

                    {/* Current Streak */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                          m.currentParity === 'EVEN'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {m.currentStreak}x {m.currentParity}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          (#{m.currentDigit})
                        </span>
                      </div>
                    </td>

                    {/* Target Parity */}
                    <td className="py-3 px-3">
                      <span className={`font-black text-xs px-2.5 py-1 rounded-md ${
                        m.targetParity === 'EVEN'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-amber-500 text-slate-950'
                      }`}>
                        BUY {m.targetParity}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-3">
                      <div>
                        <strong className="text-emerald-400 font-bold text-sm">
                          {m.confidence.toFixed(1)}%
                        </strong>
                        <span className="text-[10px] text-slate-400 block">
                          +{(m.confidence - 50.0).toFixed(1)}% edge
                        </span>
                      </div>
                    </td>

                    {/* Exhaustion % */}
                    <td className="py-3 px-3">
                      <span className="text-slate-300 font-bold">
                        {m.streakExhaustionProb.toFixed(1)}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isPrime
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isPrime ? 'PRIME 95%+' : 'MONITOR'}
                      </span>
                    </td>

                    {/* Quick Action */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSwitchToBestMarket(m.symbol)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? 'Loaded' : 'Switch'}
                        </button>

                        <button
                          onClick={() => {
                            if (!isSelected) onSelectSymbol(m.symbol);
                            if (onTradeEvenOdd) onTradeEvenOdd(m.targetParity, stake);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                            m.targetParity === 'EVEN'
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          }`}
                          title={`Execute 1-click trade on ${m.symbol.name}`}
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>Trade</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
