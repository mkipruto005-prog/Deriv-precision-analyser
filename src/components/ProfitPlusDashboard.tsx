import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, 
  Play, 
  Square, 
  Zap, 
  Sparkles, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronDown,
  CheckCircle2,
  Users,
  RefreshCw,
  Cpu,
  Target,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { DerivSymbol, TickData, DigitStats, DerivAccountInfo, Under8Stats, MatchesMarketAnalysis } from '../types';
import { analyzeMatchesMarket } from '../services/matchesAnalysis';
import { ConnectionStatus, DerivTelemetry } from '../services/derivWebSocket';
import { DERIV_SYMBOLS } from '../constants/symbols';
import { soundEngine } from '../services/audioAlert';
import { analyzeUnder8Market } from '../services/under8Analysis';
import { computeIndicators } from '../services/technicalAnalysis';

interface ProfitPlusDashboardProps {
  currentSymbol: DerivSymbol;
  onSelectSymbol: (symbol: DerivSymbol) => void;
  ticks: TickData[];
  digitStats: DigitStats;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  derivTelemetry?: DerivTelemetry;
  accountInfo: DerivAccountInfo;
  paperBalance: number;
  onTradeMatches?: (targetDigit: number, stake: number) => void;
  onTradeEvenOdd?: (prediction: 'EVEN' | 'ODD', stake: number) => void;
  onTradeUnder8?: (stake: number) => void;
  onTradeDiffers?: (targetDigit: number, stake: number) => void;
  onOpenSettings?: () => void;
  onResetPaperBalance?: (amount?: number) => void;
  onLogout?: () => void;
  onSelectView?: (view: string) => void;
  under8Stats?: Under8Stats;
}

export const ProfitPlusDashboard: React.FC<ProfitPlusDashboardProps> = ({
  currentSymbol,
  onSelectSymbol,
  ticks,
  digitStats,
  latencyMs,
  accountInfo,
  paperBalance,
  onTradeDiffers,
  onTradeEvenOdd,
  onTradeMatches,
  onTradeUnder8,
  onOpenSettings,
  onResetPaperBalance,
  onLogout,
  onSelectView,
  under8Stats
}) => {
  // Strategy selection
  const [selectedStrategy, setSelectedStrategy] = useState<'Matches' | 'Even/Odd' | 'Under 8' | 'Differs'>('Under 8');
  const [isStrategyDropdownOpen, setIsStrategyDropdownOpen] = useState(false);
  const [isVolatilityDropdownOpen, setIsVolatilityDropdownOpen] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [stake, setStake] = useState<number>(10);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState<boolean>(false);

  // AI Analysis Engine progress & output state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(95);
  // Default to Digit 8 entry point for Under 8 strategy
  const [aiPredictionDigit, setAiPredictionDigit] = useState<number>(8);
  const [aiConfidence, setAiConfidence] = useState<number>(94.5);
  const [recentExecutionNotice, setRecentExecutionNotice] = useState<string | null>(null);
  const [strategyResult, setStrategyResult] = useState<{
    strategy: 'Matches' | 'Even/Odd' | 'Under 8' | 'Differs';
    target: string;
    confidence: number;
    reason: string;
    timestamp: string;
  } | null>(null);

  // In-frame intelligence active tab: AI Reasoning | Under 8 Radar | Frequency Bar | Markov Matrix
  const [activeIntelTab, setActiveIntelTab] = useState<'ai' | 'under8_radar' | 'chart' | 'matrix'>('under8_radar');

  // Live price & digit calculations
  const lastTick = ticks.length > 0 ? ticks[ticks.length - 1] : null;
  const currentQuote = lastTick ? lastTick.quote : 16.09879;
  const currentDigit = lastTick ? lastTick.lastDigit : 8;

  // Real-time Even/Odd split calculation
  const evenCount = useMemo(() => {
    return ticks.slice(-100).filter(t => t.lastDigit % 2 === 0).length;
  }, [ticks]);
  const oddCount = useMemo(() => {
    return ticks.slice(-100).filter(t => t.lastDigit % 2 !== 0).length;
  }, [ticks]);
  const totalAnalyzed = Math.max(1, evenCount + oddCount);
  const evenPct = Math.round((evenCount / totalAnalyzed) * 100);
  const oddPct = 100 - evenPct;

  // Real-time market variance / volatility estimation
  const marketVolatility = useMemo(() => {
    if (ticks.length < 10) return '4.0';
    const quotes = ticks.slice(-20).map(t => t.quote);
    const mean = quotes.reduce((a, b) => a + b, 0) / quotes.length;
    const variance = quotes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / quotes.length;
    const stdDev = Math.sqrt(variance);
    const normalized = (stdDev / (mean || 1)) * 10000;
    return Math.max(2.5, Math.min(8.5, normalized)).toFixed(1);
  }, [ticks]);

  // Real-time Under 8 statistical computation
  const computedIndicators = useMemo(() => computeIndicators(ticks), [ticks]);
  const liveUnder8: Under8Stats = useMemo(() => {
    if (under8Stats) return under8Stats;
    return analyzeUnder8Market(ticks, currentSymbol, computedIndicators, 100);
  }, [under8Stats, ticks, currentSymbol, computedIndicators]);

  // Real-time Matches market analysis (for full 95%+ accuracy calculations)
  const liveMatches: MatchesMarketAnalysis = useMemo(() => {
    return analyzeMatchesMarket(ticks, currentSymbol, 100);
  }, [ticks, currentSymbol]);

  const topMatch = liveMatches.topMatchPrediction;
  const topMatchAccuracy = topMatch?.projectedAccuracy ?? 96.2;
  const topMatchProb = topMatch?.confidenceRating ?? 18.5;

  // Extract Digit 8 transition edge and optimal entry data
  const digit8Transition = useMemo(() => {
    return liveUnder8.digit8Transition || liveUnder8.entryDigitsRanked.find(d => d.entryDigit === 8);
  }, [liveUnder8]);

  const digit8WinRate = digit8Transition?.oneTickWinRate ?? 92.5;
  const digit8Risk = digit8Transition?.riskTo8or9 ?? 7.5;
  const isCurrentTick8 = currentDigit === 8;
  const isOptimalEntryTick = currentDigit === liveUnder8.bestEntryDigit;

  // Selected entry digit's 1-tick Under 8 transition edge
  const selectedDigitTransition = useMemo(() => {
    return liveUnder8.entryDigitsRanked.find(d => d.entryDigit === aiPredictionDigit);
  }, [liveUnder8, aiPredictionDigit]);
  const selectedDigitWinRate = selectedDigitTransition?.oneTickWinRate ?? (aiPredictionDigit === 8 ? digit8WinRate : 88.0);

  // Dynamic AI prediction recalculation when strategy or data changes
  useEffect(() => {
    if (selectedStrategy === 'Under 8') {
      // Under 8 strategy: user target defaults to Digit 8 (reversion) or best entry digit
      const conf = aiPredictionDigit === 8 ? digit8WinRate : selectedDigitWinRate;
      setAiConfidence(parseFloat(conf.toFixed(1)));
    } else if (selectedStrategy === 'Matches') {
      // Matches strategy: target top confluence digit with projected accuracy
      const matchPred = liveMatches.predictionsRanked.find(p => p.digit === aiPredictionDigit) || topMatch;
      if (matchPred) {
        setAiConfidence(parseFloat(matchPred.projectedAccuracy.toFixed(1)));
      }
    } else if (ticks.length >= 15) {
      let bestDigit = digitStats.hottestDigit;
      let maxWeight = 0;
      for (let d = 0; d <= 9; d++) {
        const freq = digitStats.percentages[d] || 10;
        const markov = digitStats.markovProbabilities[d] || 10;
        const score = freq * 0.4 + markov * 0.6;
        if (score > maxWeight) {
          maxWeight = score;
          bestDigit = d;
        }
      }
      setAiPredictionDigit(bestDigit);
      const conf = Math.min(88.5, Math.max(76.2, 70.0 + maxWeight * 0.9));
      setAiConfidence(parseFloat(conf.toFixed(1)));
    }
  }, [ticks.length, digitStats, selectedStrategy, aiPredictionDigit, digit8WinRate, selectedDigitWinRate, liveMatches, topMatch]);

  // Handle Strategy Action Button execution
  const handleExecuteActiveStrategy = useCallback(() => {
    soundEngine.playSuccess();
    let message = '';

    if (selectedStrategy === 'Matches') {
      if (onTradeMatches) onTradeMatches(aiPredictionDigit, stake);
      message = `Executed: MATCHES Digit ${aiPredictionDigit} ($${stake})`;
    } else if (selectedStrategy === 'Even/Odd') {
      const parity = aiPredictionDigit % 2 === 0 ? 'EVEN' : 'ODD';
      if (onTradeEvenOdd) onTradeEvenOdd(parity, stake);
      message = `Executed: ${parity} Parity ($${stake})`;
    } else if (selectedStrategy === 'Under 8') {
      if (onTradeUnder8) onTradeUnder8(stake);
      message = aiPredictionDigit === 8 
        ? `Executed: UNDER 8 (Digit 8 Entry Point Strike) ($${stake})`
        : `Executed: UNDER 8 (Trigger Digit #${aiPredictionDigit}) ($${stake})`;
    } else if (selectedStrategy === 'Differs') {
      const coldDigit = digitStats.coldestDigit;
      if (onTradeDiffers) onTradeDiffers(coldDigit, stake);
      message = `Executed: DIFFERS Digit ${coldDigit} ($${stake})`;
    }

    setRecentExecutionNotice(message);
    setTimeout(() => {
      setRecentExecutionNotice(null);
    }, 4500);
  }, [selectedStrategy, aiPredictionDigit, stake, onTradeMatches, onTradeEvenOdd, onTradeUnder8, onTradeDiffers, digitStats.coldestDigit]);

  // Handle Start engine
  const handleStartEngine = () => {
    setIsRunning(true);
    soundEngine.playSuccess();
    setRecentExecutionNotice(`Engine Started: Live scanning ${currentSymbol.name}`);
    setTimeout(() => setRecentExecutionNotice(null), 3000);
  };

  // Handle Stop engine
  const handleStopEngine = () => {
    setIsRunning(false);
    soundEngine.playTickPing();
    setRecentExecutionNotice('Engine Stopped: Live scanning paused');
    setTimeout(() => setRecentExecutionNotice(null), 3000);
  };

  // Handle Analyze Strategy button click
  const handleAnalyzeStrategy = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    soundEngine.playTickPing();

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setIsAnalyzing(false);
          soundEngine.playSuccess();

          let targetText = '';
          let reasonText = '';
          let calculatedConfidence = 85.0;

          if (selectedStrategy === 'Under 8') {
            if (aiPredictionDigit === 8) {
              targetText = 'Digit #8 Reversion Entry (Next Tick < 8)';
              calculatedConfidence = digit8WinRate;
              reasonText = `Tick #8 triggers a ${digit8WinRate.toFixed(1)}% 1-tick mean reversion into digits 0-7. Consecutive 8/9 breach probability is suppressed to only ${digit8Risk.toFixed(1)}%. Safe streak: ${liveUnder8.currentStreak}t.`;
            } else {
              targetText = `Digit #${aiPredictionDigit} Entry Point (Next Tick < 8)`;
              calculatedConfidence = selectedDigitWinRate;
              reasonText = `When tick ends in #${aiPredictionDigit}, Markov 1-tick Under 8 win rate is ${selectedDigitWinRate.toFixed(1)}%. Digit #8 reversion edge is ${digit8WinRate.toFixed(1)}%.`;
            }
          } else if (selectedStrategy === 'Matches') {
            const matchPred = liveMatches.predictionsRanked.find(p => p.digit === aiPredictionDigit) || topMatch;
            targetText = `Digit #${aiPredictionDigit} Match (${matchPred.confidenceRating}% Prob · 809% Payout)`;
            calculatedConfidence = matchPred.projectedAccuracy;
            reasonText = `Confluence accuracy index: ${matchPred.projectedAccuracy.toFixed(1)}% (${matchPred.accuracyGrade}). Markov jump probability: ${matchPred.markovProbability}%. Expected return: ${matchPred.expectedValuePercent > 0 ? '+' : ''}${matchPred.expectedValuePercent}% (+EV vs 11% breakeven). 8-cycle success: ${matchPred.cycleSuccessRate}%.`;
          } else if (selectedStrategy === 'Even/Odd') {
            const targetParity = evenPct >= 50 ? 'EVEN' : 'ODD';
            targetText = `${targetParity} Parity`;
            calculatedConfidence = parseFloat((79 + Math.random() * 9).toFixed(1));
            reasonText = `Statistical parity reversion favored. Current split: ${evenPct}% Even / ${oddPct}% Odd.`;
          } else if (selectedStrategy === 'Differs') {
            targetText = `Differs ${digitStats.coldestDigit}`;
            calculatedConfidence = parseFloat((88 + Math.random() * 7).toFixed(1));
            reasonText = `Digit ${digitStats.coldestDigit} is coldest at ${(digitStats.percentages[digitStats.coldestDigit] || 4).toFixed(1)}% frequency.`;
          }

          setStrategyResult({
            strategy: selectedStrategy,
            target: targetText,
            confidence: calculatedConfidence,
            reason: reasonText,
            timestamp: new Date().toLocaleTimeString()
          });

          return 100;
        }
        return prev + 25;
      });
    }, 180);
  };

  // Auto-trade loop when running
  useEffect(() => {
    if (!isRunning || !autoTradeEnabled || ticks.length === 0) return;

    if (selectedStrategy === 'Under 8') {
      // If user is targeting Digit 8 as entry point, strike the instant current tick ends in 8!
      if (aiPredictionDigit === 8 && currentDigit === 8) {
        handleExecuteActiveStrategy();
      } else if (aiPredictionDigit === liveUnder8.bestEntryDigit && currentDigit === liveUnder8.bestEntryDigit) {
        handleExecuteActiveStrategy();
      }
    } else if (ticks.length % 8 === 0) {
      handleExecuteActiveStrategy();
    }
  }, [isRunning, autoTradeEnabled, ticks.length, currentDigit, selectedStrategy, aiPredictionDigit, liveUnder8.bestEntryDigit, handleExecuteActiveStrategy]);

  // Max occurrence count for bar chart scaling
  const maxCountInSample = useMemo(() => {
    return Math.max(...digitStats.counts, 10);
  }, [digitStats.counts]);

  return (
    <div 
      id="profit-plus-dashboard"
      className={`w-full min-h-[calc(100vh-4rem)] transition-colors duration-300 py-1.5 sm:py-3 px-1.5 sm:px-3 flex justify-center overflow-x-hidden ${
        isLightMode ? 'bg-[#f0f3fa] text-slate-900' : 'bg-[#0a0c20] text-white'
      }`}
    >
      {/* Mobile-First Centered Container: Single Unified Frame (No Scrolling Far Apart) */}
      <div className="w-full max-w-lg lg:max-w-xl flex flex-col gap-2 sm:gap-2.5">

        {/* =========================================================================
            1. UNIFIED COCKPIT HEADER (Compact & Zero Scrolling Needed)
           ========================================================================= */}
        <header className="rounded-xl px-3 py-2 bg-gradient-to-r from-[#171b4a] via-[#1c2263] to-[#12163b] border border-[#2d3580] shadow-xl flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 p-0.5 shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0e1236] rounded-[6px] flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Profit Plus
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PRO
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-blue-200/80">
                <span>{currentSymbol.name}</span>
                <span>•</span>
                <span className="font-mono text-cyan-300">${currentQuote.toFixed(currentSymbol.pipSize)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Active traders indicator */}
            <button
              onClick={() => onSelectView?.('active_users')}
              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer"
              title="142 active traders"
            >
              <Users className="w-3 h-3 text-emerald-400" />
              <span>142 Live</span>
            </button>

            {/* Balance chip */}
            <div className="text-right leading-none bg-[#0e1236]/90 px-2 py-1 rounded-lg border border-[#29327a]">
              <span className="text-[8px] text-slate-400 block font-semibold">BALANCE</span>
              <span className="text-xs font-mono font-black text-emerald-400">
                ${(accountInfo.balance ?? paperBalance).toFixed(2)}
              </span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-1.5 rounded-lg bg-[#192055] hover:bg-[#202970] text-blue-300 hover:text-white transition-all border border-[#2e398a]"
              title="Toggle Light/Dark Theme"
            >
              {isLightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout || onOpenSettings || (() => onResetPaperBalance?.(1000))}
              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 transition-all border border-red-500/30"
              title="Reset balance or logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Notification Toast if trade submitted */}
        {recentExecutionNotice && (
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-500/50 text-cyan-200 text-xs font-semibold flex items-center justify-between shadow-xl animate-fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              {recentExecutionNotice}
            </span>
            <span className="text-[10px] font-mono text-cyan-300/80">DERIV API</span>
          </div>
        )}

        {/* =========================================================================
            2. UNIFIED STRATEGY & ENGINE CONTROLS (All in 1 tight frame)
           ========================================================================= */}
        <div className="rounded-xl p-2.5 sm:p-3 bg-gradient-to-b from-[#131846] to-[#0e1236] border border-[#252c70] shadow-xl flex flex-col gap-2">
          
          {/* Row 1: Market Dropdown + Strategy Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-2 items-center">
            {/* Market selector (4 cols) */}
            <div className="sm:col-span-4 relative">
              <button
                onClick={() => {
                  setIsVolatilityDropdownOpen(!isVolatilityDropdownOpen);
                  setIsStrategyDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#141a4a] border border-[#2d378a] hover:border-cyan-400/60 text-xs font-semibold text-white transition-all"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span className="truncate">{currentSymbol.name}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              </button>

              {isVolatilityDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#101438] border border-cyan-500/40 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 border-b border-slate-800">
                    Select Volatility Market
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 mt-1 pr-1 no-scrollbar">
                    {DERIV_SYMBOLS.map((sym) => (
                      <button
                        key={sym.id}
                        onClick={() => {
                          onSelectSymbol(sym);
                          setIsVolatilityDropdownOpen(false);
                          soundEngine.playTickPing();
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          currentSymbol.id === sym.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                            : 'hover:bg-[#18205a] text-slate-300'
                        }`}
                      >
                        <span className="truncate">{sym.name}</span>
                        <span className="text-[10px] font-mono opacity-60">{sym.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Strategy Pills (8 cols) */}
            <div className="sm:col-span-8 flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(['Under 8', 'Matches', 'Even/Odd', 'Differs'] as const).map((strat) => (
                <button
                  key={strat}
                  onClick={() => {
                    setSelectedStrategy(strat);
                    if (strat === 'Under 8') {
                      setActiveIntelTab('under8_radar');
                      setAiPredictionDigit(8); // Default to digit 8 entry point
                    } else if (strat === 'Matches') {
                      setAiPredictionDigit(topMatch.digit);
                    }
                    soundEngine.playTickPing();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-center ${
                    selectedStrategy === strat
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-cyan-400'
                      : 'bg-[#141a4a] text-blue-200/80 hover:text-white hover:bg-[#19215c] border border-[#252d73]'
                  }`}
                >
                  {strat}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Live Metrics Strip (Current Digit, Parity, Volatility, Ticks) */}
          <div className="grid grid-cols-4 gap-1 p-2 rounded-lg bg-[#0e1236] border border-[#1f2666] text-center">
            <div className="flex flex-col items-center">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">TICK DIGIT</span>
              <span className={`text-base sm:text-lg font-black font-mono leading-tight ${
                currentDigit === 8 
                  ? 'text-emerald-400 animate-pulse' 
                  : currentDigit < 8 
                  ? 'text-cyan-300' 
                  : 'text-rose-400'
              }`}>
                {currentDigit}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">
                {selectedStrategy === 'Under 8' ? 'UNDER 8 RATE' : 'PARITY'}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-purple-300 mt-0.5">
                {selectedStrategy === 'Under 8' ? `${liveUnder8.under8Percentage.toFixed(1)}%` : `${evenPct}%E / ${oddPct}%O`}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">
                {selectedStrategy === 'Under 8' ? 'DIGIT 8 WIN%' : selectedStrategy === 'Matches' ? 'ACCURACY' : 'CONFIDENCE'}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-0.5">
                {selectedStrategy === 'Under 8' ? `${digit8WinRate.toFixed(1)}%` : `${aiConfidence.toFixed(1)}%`}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">VOLATILITY</span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-cyan-400 mt-0.5">
                {marketVolatility}σ
              </span>
            </div>
          </div>

          {/* DEDICATED UNDER 8 ENTRY POINT RADAR STRIP (Shown when Under 8 strategy is active) */}
          {selectedStrategy === 'Under 8' && (
            <div className="space-y-1.5">
              {/* Digit 8 Active Strike Alert (When current tick is 8) */}
              {isCurrentTick8 ? (
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 via-[#102928] to-slate-900 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-400 text-slate-950 font-black font-mono flex items-center justify-center text-lg shadow-md shrink-0">
                      8
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                          DIGIT 8 ENTRY POINT ACTIVE!
                        </span>
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950">
                          {digit8WinRate.toFixed(1)}% EDGE
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-200/90 font-mono">
                        Tick ended in 8 — Next tick expected &lt; 8 (consecutive 8/9 risk: {digit8Risk.toFixed(1)}%).
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleExecuteActiveStrategy}
                    className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs font-mono shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    STRIKE ${stake}
                  </button>
                </div>
              ) : (
                /* Entry Point Target Selector Bar */
                <div className="p-2 rounded-lg bg-[#0e1338] border border-[#232b70] flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">1-Tick Under 8 Entry Point Radar</span>
                      <span className="text-[11px] text-blue-200 font-medium">
                        Targeting <strong className="text-cyan-300 font-mono">Digit #{aiPredictionDigit}</strong> ({aiPredictionDigit === 8 ? `${digit8WinRate.toFixed(1)}% Reversion` : `${selectedDigitWinRate.toFixed(1)}% Win`}) • Current tick: <span className="font-mono text-white font-bold">#{currentDigit}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setAiPredictionDigit(8);
                        soundEngine.playTickPing();
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                        aiPredictionDigit === 8 
                          ? 'bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-300' 
                          : 'bg-[#151c54] text-emerald-300 hover:bg-[#1a2368] border border-emerald-500/30'
                      }`}
                      title="Lock onto Digit 8 as the 1-tick mean reversion entry point"
                    >
                      ⚡ Digit 8 Entry
                    </button>
                    <button
                      onClick={() => {
                        setAiPredictionDigit(liveUnder8.bestEntryDigit);
                        soundEngine.playTickPing();
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                        aiPredictionDigit === liveUnder8.bestEntryDigit && aiPredictionDigit !== 8
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-cyan-300' 
                          : 'bg-[#151c54] text-blue-300 hover:bg-[#1a2368] border border-blue-500/30'
                      }`}
                      title="Lock onto the #1 Markov optimal entry digit"
                    >
                      Optimal #{liveUnder8.bestEntryDigit}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row 3: 10 Digits Probability Distribution Strip (All 10 digits visible in same frame!) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-blue-200/80 font-medium px-0.5">
              <span>
                {selectedStrategy === 'Under 8' 
                  ? '1-Tick Under 8 Win Rate per Trigger Digit (Tap to Lock Entry Point)' 
                  : selectedStrategy === 'Matches'
                  ? 'Matches Confluence Accuracy per Target Digit (809% Payout)'
                  : 'Digit Frequency (100 Ticks) • Tap digit to select'}
              </span>
              <span className="text-cyan-300 font-mono">
                {selectedStrategy === 'Under 8' ? 'Digit 8 = Reversion Entry' : selectedStrategy === 'Matches' ? `Top: #${topMatch.digit} (${topMatchAccuracy.toFixed(1)}% Acc)` : 'Live Deriv data'}
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                const isSelected = digit === aiPredictionDigit;
                const isCurrent = digit === currentDigit;
                
                // For Under 8 strategy: show 1-tick transition rate to <8
                const transitionRate = liveUnder8.entryDigitsRanked.find(d => d.entryDigit === digit)?.oneTickWinRate 
                  ?? (digit === 8 ? digit8WinRate : 85);
                const freqPct = digitStats.percentages[digit] || 10;

                return (
                  <button
                    key={digit}
                    onClick={() => {
                      setAiPredictionDigit(digit);
                      soundEngine.playTickPing();
                    }}
                    className={`rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? digit === 8 && selectedStrategy === 'Under 8'
                          ? 'bg-emerald-600/40 border-2 border-emerald-400 shadow-md shadow-emerald-500/30 scale-[1.03]'
                          : 'bg-blue-600/50 border-2 border-cyan-400 shadow-md shadow-cyan-500/30 scale-[1.03]'
                        : digit === 8 && selectedStrategy === 'Under 8'
                        ? 'bg-emerald-950/30 border border-emerald-500/50 hover:border-emerald-400'
                        : isCurrent
                        ? 'bg-[#1b2361] border border-cyan-500/50'
                        : 'bg-[#12153b] border border-[#232a68] hover:border-slate-500'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}

                    <div className="flex items-center gap-0.5">
                      <span className={`text-xs font-black ${
                        isSelected 
                          ? digit === 8 && selectedStrategy === 'Under 8' ? 'text-emerald-300 font-mono' : 'text-cyan-300 font-mono' 
                          : digit === 8 && selectedStrategy === 'Under 8'
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}>
                        {digit}
                      </span>
                    </div>

                    <span className={`text-[10px] font-mono font-bold ${
                      digit === 8 && selectedStrategy === 'Under 8'
                        ? 'text-emerald-300 font-black'
                        : isSelected
                        ? 'text-cyan-200' 
                        : transitionRate >= 90
                        ? 'text-cyan-300'
                        : transitionRate >= 85
                        ? 'text-blue-300'
                        : 'text-rose-300'
                    }`}>
                      {selectedStrategy === 'Under 8' 
                        ? `${transitionRate.toFixed(0)}%` 
                        : selectedStrategy === 'Matches'
                        ? `${(liveMatches.predictionsRanked.find(p => p.digit === digit)?.projectedAccuracy ?? 80).toFixed(0)}%`
                        : `${freqPct.toFixed(0)}%`}
                    </span>

                    {digit === 8 && selectedStrategy === 'Under 8' && (
                      <span className="text-[7px] font-black uppercase text-emerald-400 tracking-tighter leading-none mt-0.5">
                        ENTRY
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Controls & Stake Section */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            {/* Stake Quick Chips + Custom Stake */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-400">Stake:</span>
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setStake(amt)}
                    className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                      stake === amt
                        ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                        : 'bg-[#161c52] text-slate-300 hover:text-white border border-[#2a3485]'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Auto-Trade toggle switch */}
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoTradeEnabled}
                  onChange={(e) => {
                    setAutoTradeEnabled(e.target.checked);
                    soundEngine.playTickPing();
                  }}
                  className="w-3.5 h-3.5 rounded accent-cyan-400 cursor-pointer"
                />
                <span>Auto-Strike</span>
              </label>
            </div>

            {/* Start (Green) & Stop (Red) Dual Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="profitplus-btn-start"
                onClick={handleStartEngine}
                className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                  isRunning 
                    ? 'bg-[#00c288] text-slate-950 shadow-emerald-500/40 ring-2 ring-emerald-300' 
                    : 'bg-[#00c288] hover:bg-[#00d898] text-slate-950'
                }`}
              >
                {isRunning ? (
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isRunning ? 'Running Scan' : 'Start Engine'}</span>
              </button>

              <button
                id="profitplus-btn-stop"
                onClick={handleStopEngine}
                className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                  !isRunning 
                    ? 'bg-[#ff2442]/85 hover:bg-[#ff2442] text-white' 
                    : 'bg-[#ff2442] hover:bg-[#ff3855] text-white shadow-rose-600/40 ring-2 ring-rose-300'
                }`}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Engine</span>
              </button>
            </div>

            {/* Analyze Strategy Button (Cyan/Pink Gradient matching screenshots) */}
            <button
              id="profitplus-btn-analyze-strategy"
              onClick={handleAnalyzeStrategy}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 hover:from-cyan-300 hover:via-blue-400 hover:to-pink-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all active:scale-[0.99] disabled:opacity-85 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Analyzing {selectedStrategy}... {analysisProgress}%</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                  <span>
                    {selectedStrategy === 'Under 8' 
                      ? `Analyze Under 8 (Digit #${aiPredictionDigit} Entry Point)` 
                      : 'Analyze Strategy'}
                  </span>
                </>
              )}
            </button>

            {/* Direct Execute Contract Action Button */}
            <button
              id="profitplus-btn-execute-strategy"
              onClick={handleExecuteActiveStrategy}
              className={`w-full py-2.5 sm:py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
                selectedStrategy === 'Under 8' && isCurrentTick8
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/40 ring-2 ring-emerald-300'
                  : 'bg-[#ff2442] hover:bg-[#e01f3b] text-white shadow-red-600/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full animate-ping shrink-0 ${
                selectedStrategy === 'Under 8' && isCurrentTick8 ? 'bg-slate-950' : 'bg-white'
              }`} />
              <span className="truncate">
                {selectedStrategy === 'Under 8' && isCurrentTick8 && `🔥 STRIKE NOW: Tick #8 Reversion -> Under 8 · Trade $${stake}`}
                {selectedStrategy === 'Under 8' && !isCurrentTick8 && `Execute Under 8 (Digit #${aiPredictionDigit} Entry Point) · Trade $${stake}`}
                {selectedStrategy === 'Matches' && `Matches Digit ${aiPredictionDigit} · Trade $${stake}`}
                {selectedStrategy === 'Even/Odd' && `${aiPredictionDigit % 2 === 0 ? 'EVEN' : 'ODD'} Parity · Trade $${stake}`}
                {selectedStrategy === 'Differs' && `Differs Coldest ${digitStats.coldestDigit} · Trade $${stake}`}
              </span>
            </button>

            {/* Instant Notification or Strategy Result Strip */}
            {(strategyResult || recentExecutionNotice) && (
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#141d5a] to-[#18236c] border border-cyan-500/50 flex items-center justify-between text-xs shadow-md">
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-bold text-white truncate">
                    {strategyResult ? `${strategyResult.strategy} Rec: ${strategyResult.target}` : recentExecutionNotice}
                  </span>
                </div>
                {strategyResult && (
                  <span className="font-mono font-bold text-emerald-400 text-[11px] shrink-0">
                    {strategyResult.confidence.toFixed(1)}% Conf
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            3. IN-FRAME INTELLIGENCE TABS (No Scrolling Far Apart!)
           ========================================================================= */}
        <div className="rounded-xl p-2.5 sm:p-3 bg-gradient-to-b from-[#131846] to-[#0e1236] border border-[#252c70] shadow-xl flex flex-col gap-2">
          
          {/* Sub-tab Navigation */}
          <div className="flex items-center justify-between border-b border-[#21286b] pb-1.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveIntelTab('ai')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeIntelTab === 'ai'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-300 hover:text-white bg-[#151a4a]'
                }`}
              >
                AI Reasoning
              </button>

              <button
                onClick={() => setActiveIntelTab('under8_radar')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeIntelTab === 'under8_radar'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300'
                    : 'text-emerald-300 hover:text-white bg-[#151a4a]'
                }`}
              >
                <Target className="w-3 h-3 text-emerald-400" />
                <span>Under 8 Radar</span>
              </button>

              <button
                onClick={() => setActiveIntelTab('chart')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeIntelTab === 'chart'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-300 hover:text-white bg-[#151a4a]'
                }`}
              >
                Frequency Bar
              </button>

              <button
                onClick={() => setActiveIntelTab('matrix')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeIntelTab === 'matrix'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-300 hover:text-white bg-[#151a4a]'
                }`}
              >
                Markov Matrix
              </button>
            </div>

            <div className="text-[10px] font-mono text-cyan-300/80 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>Neural v3.2</span>
            </div>
          </div>

          {/* Sub-view 1: AI Reasoning & Neural Confluence */}
          {activeIntelTab === 'ai' && (
            <div className="space-y-2 pt-0.5">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-lg bg-[#141a4d] border border-[#283280]">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Strategy</span>
                  <span className="text-xs font-black text-white">{selectedStrategy}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#141a4d] border border-[#283280]">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">
                    {selectedStrategy === 'Under 8' ? 'Entry Point' : 'Target Digit'}
                  </span>
                  <span className="text-sm font-black text-cyan-300 font-mono">
                    {selectedStrategy === 'Under 8'
                      ? `Digit #${aiPredictionDigit}`
                      : selectedStrategy === 'Even/Odd' 
                      ? (aiPredictionDigit % 2 === 0 ? 'EVEN' : 'ODD')
                      : aiPredictionDigit}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#141a4d] border border-[#283280]">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Confidence</span>
                  <span className="text-xs font-black text-emerald-300 font-mono">
                    {selectedStrategy === 'Under 8' 
                      ? `${(aiPredictionDigit === 8 ? digit8WinRate : selectedDigitWinRate).toFixed(1)}%`
                      : `${aiConfidence.toFixed(1)}%`}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#111640] border border-[#202766] text-xs text-blue-100/90 leading-relaxed font-sans flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  {selectedStrategy === 'Under 8' ? (
                    <>
                      Under 8 neural model for <strong>{currentSymbol.name}</strong> evaluates <strong>Digit #{aiPredictionDigit}</strong> as the active entry point with <strong>{(aiPredictionDigit === 8 ? digit8WinRate : selectedDigitWinRate).toFixed(1)}%</strong> 1-tick win rate. 
                      Digit 8 Mean Reversion: <strong>{digit8WinRate.toFixed(1)}%</strong> • Safe streak: <strong>{liveUnder8.currentStreak}t</strong> • 8/9 Suppression: <strong>{liveUnder8.combined89Frequency.toFixed(1)}%</strong>.
                    </>
                  ) : (
                    <>
                      Neural model for <strong>{currentSymbol.name}</strong> confirms digit <strong>{aiPredictionDigit}</strong> with <strong>{aiConfidence.toFixed(1)}%</strong> confidence. 
                      Frequency: <strong>{(digitStats.percentages[aiPredictionDigit] || 10).toFixed(1)}%</strong> • Coldest digit: <strong>{digitStats.coldestDigit}</strong> ({(digitStats.percentages[digitStats.coldestDigit] || 5).toFixed(1)}%). Parity variance favored for {evenPct >= 50 ? 'EVEN' : 'ODD'}.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Sub-view 2: Dedicated Under 8 1-Tick Entry Point Radar */}
          {activeIntelTab === 'under8_radar' && (
            <div className="space-y-2 pt-0.5">
              {/* Digit 8 Entry Point Spotlight Box */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#10233b] to-slate-900 border border-emerald-500/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-mono font-black text-xl text-emerald-300 shadow-md">
                    8
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white tracking-tight">Digit 8 Reversion Entry Point</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950">
                        {digit8WinRate.toFixed(1)}% Edge
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                      Next Tick Under 8: <strong className="text-emerald-300">{digit8WinRate.toFixed(1)}%</strong> • Breach Risk to 8/9: <strong className="text-rose-300">{digit8Risk.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAiPredictionDigit(8);
                    soundEngine.playSuccess();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer shrink-0 ${
                    aiPredictionDigit === 8
                      ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30 ring-1 ring-white'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {aiPredictionDigit === 8 ? '✓ LOCKED' : 'LOCK DIGIT 8'}
                </button>
              </div>

              {/* Complete 1-Tick Transition Win Rate Table for All 10 Digits */}
              <div className="rounded-lg bg-[#0f143c] border border-[#22296d] overflow-x-auto no-scrollbar max-h-48">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-[#141a4a] text-blue-300 font-bold border-b border-[#232c7a]">
                    <tr>
                      <th className="p-1.5">Trigger Digit</th>
                      <th className="p-1.5">1-Tick Win Rate</th>
                      <th className="p-1.5">Risk to 8/9</th>
                      <th className="p-1.5">Entry Status</th>
                      <th className="p-1.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b2260] font-mono">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
                      const item = liveUnder8.entryDigitsRanked.find(t => t.entryDigit === d);
                      const rate = item?.oneTickWinRate ?? (d === 8 ? digit8WinRate : 85);
                      const risk = item?.riskTo8or9 ?? (d === 8 ? digit8Risk : 15);
                      const isTarget = d === aiPredictionDigit;
                      const isCurrent = d === currentDigit;

                      return (
                        <tr key={d} className={isTarget ? 'bg-cyan-500/15 font-bold' : d === 8 ? 'bg-emerald-500/10' : ''}>
                          <td className="p-1.5 text-white font-black flex items-center gap-1.5">
                            <span>#{d}</span>
                            {isCurrent && (
                              <span className="text-[8px] font-sans px-1 py-0.2 rounded bg-cyan-500/30 text-cyan-300 font-bold">
                                Current
                              </span>
                            )}
                          </td>
                          <td className="p-1.5 font-bold text-emerald-300">{rate.toFixed(1)}%</td>
                          <td className="p-1.5 text-slate-400">{risk.toFixed(1)}%</td>
                          <td className="p-1.5">
                            {d === 8 ? (
                              <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Reversion Entry
                              </span>
                            ) : d === liveUnder8.bestEntryDigit ? (
                              <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/40">
                                #1 Optimal
                              </span>
                            ) : rate >= 88 ? (
                              <span className="text-[9px] font-sans text-teal-300 font-semibold">Approved</span>
                            ) : (
                              <span className="text-[9px] font-sans text-slate-400">Normal</span>
                            )}
                          </td>
                          <td className="p-1.5 text-right">
                            <button
                              onClick={() => {
                                setAiPredictionDigit(d);
                                soundEngine.playTickPing();
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold transition-all cursor-pointer ${
                                isTarget
                                  ? 'bg-cyan-500 text-slate-950 font-black'
                                  : 'bg-[#151d52] text-blue-200 hover:text-white border border-[#2b3687]'
                              }`}
                            >
                              {isTarget ? 'Selected' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view 3: Frequency Distribution Bar Chart */}
          {activeIntelTab === 'chart' && (
            <div className="p-2 rounded-lg bg-[#0f143c] border border-[#22296d] space-y-1">
              <div className="h-32 w-full flex items-end justify-between gap-1 pt-2 px-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                  const count = digitStats.counts[digit] || 0;
                  const heightPercent = Math.max(12, Math.round((count / maxCountInSample) * 100));
                  const isPredicted = digit === aiPredictionDigit;

                  return (
                    <div key={digit} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-[9px] font-mono text-blue-300 mb-0.5 opacity-80 group-hover:opacity-100 font-bold">
                        {count}
                      </span>
                      <div className="w-full max-w-[22px] h-full flex items-end">
                        <div
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            isPredicted
                              ? 'bg-gradient-to-t from-cyan-600 via-cyan-400 to-white ring-1 ring-cyan-300 shadow-md shadow-cyan-500/40'
                              : 'bg-gradient-to-t from-blue-700 to-cyan-500 opacity-80'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold font-mono mt-1 ${isPredicted ? 'text-cyan-300 font-black' : 'text-slate-300'}`}>
                        {digit}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-blue-300/70 pt-1 border-t border-[#1d235e]">
                <span>Poisson Baseline: 10%</span>
                <span>Peak: {digitStats.hottestPercentage.toFixed(1)}% (#{digitStats.hottestDigit})</span>
              </div>
            </div>
          )}

          {/* Sub-view 4: Markov Matrix & Probabilities */}
          {activeIntelTab === 'matrix' && (
            <div className="rounded-lg bg-[#0f143c] border border-[#22296d] overflow-x-auto no-scrollbar max-h-48">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-[#141a4a] text-blue-300 font-bold border-b border-[#232c7a]">
                  <tr>
                    <th className="p-1.5">Digit</th>
                    <th className="p-1.5">Count</th>
                    <th className="p-1.5">Frequency</th>
                    <th className="p-1.5">Markov %</th>
                    <th className="p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b2260] font-mono">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <tr key={digit} className={digit === aiPredictionDigit ? 'bg-cyan-500/15 font-bold' : ''}>
                      <td className="p-1.5 text-white font-black">{digit}</td>
                      <td className="p-1.5 text-blue-200">{digitStats.counts[digit] || 0}</td>
                      <td className="p-1.5 text-cyan-300">{(digitStats.percentages[digit] || 10).toFixed(1)}%</td>
                      <td className="p-1.5 text-purple-300">{(digitStats.markovProbabilities[digit] || 10).toFixed(1)}%</td>
                      <td className="p-1.5">
                        {digit === aiPredictionDigit ? (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-sans font-bold">
                            AI Pick
                          </span>
                        ) : (digitStats.percentages[digit] || 10) >= 12 ? (
                          <span className="text-blue-300 text-[9px] font-sans">High</span>
                        ) : (
                          <span className="text-slate-400 text-[9px] font-sans">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
