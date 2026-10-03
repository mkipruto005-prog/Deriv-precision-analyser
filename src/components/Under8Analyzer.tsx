import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  TickData, 
  IndicatorValues, 
  DerivSymbol, 
  PrecisionSignal,
  Under8Stats,
  MarketScanResult,
  TradeRecord
} from '../types';
import { 
  analyzeUnder8Market, 
  scanAllVolatilityMarkets 
} from '../services/under8Analysis';
import { DERIV_SYMBOLS } from '../constants/symbols';
import { Under8BotPanel, BotConfig, BotStats, BotLogEntry } from './Under8BotPanel';
import { 
  ShieldCheck, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Clock, 
  Flame, 
  Percent, 
  Calculator, 
  Layers, 
  ChevronRight,
  Info,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  ArrowDownRight,
  Crosshair,
  Search,
  Compass,
  Radio,
  Target,
  ArrowRight,
  Check,
  RefreshCw,
  Bot,
  Sliders,
  Lock,
  Download,
  Link as LinkIcon,
  Wallet,
  FileCode2
} from 'lucide-react';
import { DerivAccountInfo } from '../types';
import { DerivBotModal } from './DerivBotModal';

interface Under8AnalyzerProps {
  ticks: TickData[];
  indicators: IndicatorValues;
  symbol: DerivSymbol;
  onExecuteTrade: (signal: PrecisionSignal, stake: number) => void;
  pendingTrade: {
    signal: PrecisionSignal;
    ticksElapsed: number;
    targetTicks: number;
    stake: number;
  } | null;
  onSelectSymbol?: (symbol: DerivSymbol) => void;
  allSymbols?: DerivSymbol[];
  trades?: TradeRecord[];
  paperBalance?: number;
  accountInfo?: DerivAccountInfo;
  apiToken?: string;
  appId?: string;
  onSaveConfig?: (appId: string, apiToken: string) => void;
  isLiveExecutionEnabled?: boolean;
  onToggleLiveExecution?: (enabled: boolean) => void;
}

export const Under8Analyzer: React.FC<Under8AnalyzerProps> = ({
  ticks,
  indicators,
  symbol,
  onExecuteTrade,
  pendingTrade,
  onSelectSymbol,
  allSymbols = DERIV_SYMBOLS,
  trades = [],
  paperBalance = 10000,
  accountInfo = { isAuthorized: false } as DerivAccountInfo,
  apiToken = '',
  appId = '1089',
  onSaveConfig = () => {},
  isLiveExecutionEnabled = false,
  onToggleLiveExecution = () => {}
}) => {
  const [windowSize, setWindowSize] = useState<number>(100);
  const [stakeAmount, setStakeAmount] = useState<number>(1);
  // Strictly 1 tick per trade as requested by user
  const durationTicks = 1;
  const [autoStrikeOnOptimalDigit, setAutoStrikeOnOptimalDigit] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'bot' | 'scanner'>('terminal');

  // Deriv Bot Export & Direct Link Modal State
  const [isDerivBotModalOpen, setIsDerivBotModalOpen] = useState<boolean>(false);
  const [derivBotModalDefaultTab, setDerivBotModalDefaultTab] = useState<'download' | 'link'>('download');

  const handleOpenDownloadBotModal = () => {
    setDerivBotModalDefaultTab('download');
    setIsDerivBotModalOpen(true);
  };

  const handleOpenLinkAccountModal = () => {
    setDerivBotModalDefaultTab('link');
    setIsDerivBotModalOpen(true);
  };

  // Scanner & Locked Market state
  const [scanCycle, setScanCycle] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedTime, setLastScannedTime] = useState<string>(() => new Date().toLocaleTimeString('en-GB'));
  const [scannerNotification, setScannerNotification] = useState<string | null>(null);

  // Under 8 Autonomous Sniper Bot State (Defaults to staying on the scanned market)
  const [botActive, setBotActive] = useState<boolean>(false);
  const [botStatus, setBotStatus] = useState<string>('IDLE');
  const [botConfig, setBotConfig] = useState<BotConfig>({
    mode: 'single_market',
    entrySensitivity: 'optimal_only',
    baseStake: 1,
    stakeStrategy: 'recovery',
    takeProfit: 5,
    stopLoss: 25,
    maxTrades: 30,
    maxConsecutiveLosses: 3,
    minWinRate: 84,
    lossRecoveryMarketSwitch: true
  });

  const [botStats, setBotStats] = useState<BotStats>({
    tradesCount: 0,
    wins: 0,
    losses: 0,
    netProfit: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  const [currentBotStake, setCurrentBotStake] = useState<number>(1);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryTargetSymbol, setRecoveryTargetSymbol] = useState<DerivSymbol | null>(null);
  const [recoveryAttemptCount, setRecoveryAttemptCount] = useState<number>(0);
  const [botLogs, setBotLogs] = useState<BotLogEntry[]>([]);

  // Refs for Bot lifecycle & debounce
  const lastBotSignalIdRef = useRef<string | null>(null);
  const lastProcessedTradeIdRef = useRef<string | null>(null);
  const lastBotStrikeEpochRef = useRef<number>(0);
  const lastCooldownTickEpochRef = useRef<number>(0);
  const currentBotStatusRef = useRef<string>('IDLE');

  const updateBotStatus = useCallback((newStatus: string) => {
    if (currentBotStatusRef.current !== newStatus) {
      currentBotStatusRef.current = newStatus;
      setBotStatus(newStatus);
    }
  }, []);

  const addBotLog = useCallback((type: BotLogEntry['type'], message: string) => {
    const timeStr = new Date().toLocaleTimeString('en-GB');
    const newEntry: BotLogEntry = {
      id: `BL_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
      type,
      message
    };
    setBotLogs((prev) => [newEntry, ...prev.slice(0, 99)]);
  }, []);

  // Compute live Under 8 statistics for active market
  const stats: Under8Stats = useMemo(() => {
    return analyzeUnder8Market(ticks, symbol, indicators, windowSize);
  }, [ticks, symbol, indicators, windowSize]);

  // Scan all volatility markets to evaluate Under 8 conditions across Deriv
  const marketScanList: MarketScanResult[] = useMemo(() => {
    return scanAllVolatilityMarkets(allSymbols, symbol, ticks, indicators);
  }, [allSymbols, symbol, ticks, indicators, scanCycle]);

  const topMarket = marketScanList.length > 0 ? marketScanList[0] : null;
  const isCurrentTopMarket = topMarket?.symbol?.id === symbol?.id;

  // Scan & Lock: Evaluates all markets, switches to the #1 market, and locks until user manually rescans
  const handleRescanBestMarket = useCallback(() => {
    setIsScanning(true);
    setScanCycle((c) => c + 1);

    // Perform fresh ranking scan
    const scanned = scanAllVolatilityMarkets(allSymbols, symbol, ticks, indicators);
    const best = scanned.length > 0 ? scanned[0] : null;

    if (best && onSelectSymbol) {
      const timeStr = new Date().toLocaleTimeString('en-GB');
      setLastScannedTime(timeStr);
      onSelectSymbol(best.symbol);
      setScannerNotification(
        `🔒 Scanned & Locked onto ${best.symbol.name} (Under 8 Score: ${best.score}/100, Optimal Digit: #${best.bestEntryDigit}). Staying on this market until you click Rescan.`
      );
      addBotLog(
        'switch',
        `🔒 Market Rescanned: Locked onto ${best.symbol.name} (#1 Under 8 Score: ${best.score}/100, Prime Digit #${best.bestEntryDigit}). Staying with this market until you rescan.`
      );
      setTimeout(() => setScannerNotification(null), 6000);
    }
    setTimeout(() => setIsScanning(false), 500);
  }, [allSymbols, symbol, ticks, indicators, onSelectSymbol, addBotLog]);

  // Evaluates all volatility markets and selects the highest-scoring alternative market for recovery after a loss
  const findBestRecoveryMarket = useCallback(
    (currentSymId: string): MarketScanResult | null => {
      const scanned = scanAllVolatilityMarkets(allSymbols, symbol, ticks, indicators);
      if (!scanned || scanned.length === 0) return null;
      // Filter out the symbol that just sustained the breach/loss
      const altMarkets = scanned.filter((m) => m.symbol.id !== currentSymId);
      if (altMarkets.length > 0) {
        return altMarkets[0];
      }
      return scanned[0];
    },
    [allSymbols, symbol, ticks, indicators]
  );

  const currentTick = ticks[ticks.length - 1];
  const currentDigit = currentTick ? currentTick.lastDigit : 5;

  // Track last executed tick epoch to avoid double triggers on same tick
  const lastAutoStrikeEpochRef = useRef<number>(0);

  // Toggle Bot master switch
  const handleToggleBot = useCallback(() => {
    if (botActive) {
      setBotActive(false);
      setAutoStrikeOnOptimalDigit(false);
      setIsRecovering(false);
      setRecoveryTargetSymbol(null);
      setRecoveryAttemptCount(0);
      updateBotStatus('STOPPED');
      addBotLog('info', '⏹️ Under 8 Bot paused by user.');
    } else {
      setBotActive(true);
      setAutoStrikeOnOptimalDigit(true);
      setIsRecovering(false);
      setRecoveryTargetSymbol(null);
      setRecoveryAttemptCount(0);
      updateBotStatus('RUNNING');
      setCurrentBotStake(botConfig.baseStake);
      setConsecutiveLosses(0);
      addBotLog(
        'info',
        `🤖 Under 8 Sniper Bot activated. Mode: ${
          botConfig.mode === 'market_hunter' ? 'Multi-Market Hunter' : `Single Market (${symbol.name})`
        } | Base Stake: $${botConfig.baseStake} | TP: +$${botConfig.takeProfit} | SL: -$${botConfig.stopLoss} | Auto-Recovery Switch: ${botConfig.lossRecoveryMarketSwitch !== false ? 'ON' : 'OFF'}`
      );
    }
  }, [botActive, botConfig, symbol.name, addBotLog, updateBotStatus]);

  const handleResetBotStats = useCallback(() => {
    setBotStats({
      tradesCount: 0,
      wins: 0,
      losses: 0,
      netProfit: 0,
      currentStreak: 0,
      bestStreak: 0
    });
    setConsecutiveLosses(0);
    setIsRecovering(false);
    setRecoveryTargetSymbol(null);
    setRecoveryAttemptCount(0);
    setCurrentBotStake(botConfig.baseStake);
    addBotLog('info', '🔄 Bot session performance counters reset.');
  }, [botConfig.baseStake, addBotLog]);

  // Sync trade settlements from App trades log
  useEffect(() => {
    if (!trades || trades.length === 0) return;
    const latestTrade = trades[trades.length - 1];

    if (
      latestTrade.signalId === lastBotSignalIdRef.current &&
      latestTrade.id !== lastProcessedTradeIdRef.current
    ) {
      lastProcessedTradeIdRef.current = latestTrade.id;
      lastBotSignalIdRef.current = null;
      lastCooldownTickEpochRef.current = latestTrade.timestamp;

      const isWin = latestTrade.outcome === 'WIN';
      const profit = latestTrade.profit;

      setBotStats((prev) => {
        const newTrades = prev.tradesCount + 1;
        const newWins = isWin ? prev.wins + 1 : prev.wins;
        const newLosses = !isWin ? prev.losses + 1 : prev.losses;
        const newProfit = parseFloat((prev.netProfit + profit).toFixed(2));
        const newStreak = isWin ? prev.currentStreak + 1 : 0;
        const newBest = Math.max(prev.bestStreak, newStreak);

        if (newProfit >= botConfig.takeProfit) {
          setBotActive(false);
          setAutoStrikeOnOptimalDigit(false);
          setIsRecovering(false);
          updateBotStatus(`TARGET REACHED (+${newProfit.toFixed(2)})`);
          addBotLog(
            'win',
            `🏆 TAKE PROFIT TARGET REACHED! Net: +$${newProfit.toFixed(2)}. Bot safely completed session.`
          );
        } else if (newProfit <= -botConfig.stopLoss) {
          setBotActive(false);
          setAutoStrikeOnOptimalDigit(false);
          setIsRecovering(false);
          updateBotStatus(`STOP LOSS HIT (-${Math.abs(newProfit).toFixed(2)})`);
          addBotLog(
            'loss',
            `🛡️ STOP LOSS HIT! Net drawdown: -$${Math.abs(newProfit).toFixed(2)}. Bot halted to preserve capital.`
          );
        } else if (newTrades >= botConfig.maxTrades) {
          setBotActive(false);
          setAutoStrikeOnOptimalDigit(false);
          setIsRecovering(false);
          updateBotStatus('MAX TRADES REACHED');
          addBotLog('info', `🏁 Completed maximum trades limit (${botConfig.maxTrades}). Bot finished.`);
        }

        return {
          tradesCount: newTrades,
          wins: newWins,
          losses: newLosses,
          netProfit: newProfit,
          currentStreak: newStreak,
          bestStreak: newBest
        };
      });

      if (isWin) {
        setConsecutiveLosses(0);
        const wasInRecovery = isRecovering;
        setIsRecovering(false);
        setRecoveryTargetSymbol(null);
        setRecoveryAttemptCount(0);
        setCurrentBotStake(botConfig.baseStake);

        if (wasInRecovery) {
          addBotLog(
            'win',
            `🎉 RECOVERY SUCCESSFUL! Won +$${profit >= 0 ? profit.toFixed(2) : '0.00'} on ${symbol.name}! Exit was #${latestTrade.exitDigit} (< 8). Previous loss fully recouped! Resetting stake to base $${botConfig.baseStake.toFixed(2)}.`
          );
          updateBotStatus('RECOVERY COMPLETE - NORMAL OPERATION');
        } else {
          addBotLog(
            'win',
            `✅ 1-TICK WIN (+${profit >= 0 ? '$' + profit.toFixed(2) : profit})! Exit digit was #${latestTrade.exitDigit} (Under 8).`
          );
        }
      } else {
        const nextLosses = consecutiveLosses + 1;
        setConsecutiveLosses(nextLosses);

        if (nextLosses >= botConfig.maxConsecutiveLosses) {
          setBotActive(false);
          setAutoStrikeOnOptimalDigit(false);
          setIsRecovering(false);
          updateBotStatus('MAX CONSECUTIVE LOSSES SAFEGUARD');
          addBotLog(
            'alert',
            `🛑 Reached ${nextLosses} consecutive losses. Capital preservation safeguard triggered, bot stopped.`
          );
        } else {
          // Under 8 Martingale calculation: ~24% payout -> 4.3x multiplier covers previous loss plus profit
          const lossAmount = Math.abs(profit);
          const recoveryStake = Math.min(
            botConfig.stopLoss,
            250,
            parseFloat((lossAmount * 4.3 + botConfig.baseStake).toFixed(2))
          );
          setCurrentBotStake(recoveryStake);
          setIsRecovering(true);
          setRecoveryAttemptCount((prev) => prev + 1);

          if (botConfig.lossRecoveryMarketSwitch !== false && onSelectSymbol) {
            const bestRecovery = findBestRecoveryMarket(symbol.id);
            if (bestRecovery && bestRecovery.symbol.id !== symbol.id) {
              setRecoveryTargetSymbol(bestRecovery.symbol);
              onSelectSymbol(bestRecovery.symbol);
              setScannerNotification(
                `🔄 Loss Recovery: Switched to ${bestRecovery.symbol.name} (#1 Under 8 Score: ${bestRecovery.score}/100) to recover loss ($${recoveryStake.toFixed(2)}).`
              );
              setTimeout(() => setScannerNotification(null), 7000);

              addBotLog(
                'switch',
                `🔄 LOSS DETECTED (-$${lossAmount.toFixed(2)} on exit #${latestTrade.exitDigit}). Auto-Recovery Hunter initiated: Scanned 13+ Deriv indices. Switched from ${symbol.name} ➔ ${bestRecovery.symbol.name} (#1 Under 8 Score: ${bestRecovery.score}/100, Optimal Digit: #${bestRecovery.bestEntryDigit}, ${bestRecovery.oneTickWinRateForBestDigit}% win rate). Next Recovery Stake: $${recoveryStake.toFixed(2)}.`
              );
              updateBotStatus(
                `RECOVERY: Switched to ${bestRecovery.symbol.name} | Waiting for #${bestRecovery.bestEntryDigit} ($${recoveryStake.toFixed(2)})`
              );
            } else {
              addBotLog(
                'loss',
                `❌ 1-TICK LOSS (-$${lossAmount.toFixed(2)}). Exit was #${latestTrade.exitDigit}. Maintaining ${symbol.name} with recovery stake: $${recoveryStake.toFixed(2)}.`
              );
              updateBotStatus(`RECOVERY: Staking $${recoveryStake.toFixed(2)} on #${stats.bestEntryDigit}`);
            }
          } else {
            addBotLog(
              'loss',
              `❌ 1-TICK LOSS (-$${lossAmount.toFixed(2)}). Exit was #${latestTrade.exitDigit}. Smart Recovery calculating next stake: $${recoveryStake.toFixed(2)}.`
            );
            updateBotStatus(`RECOVERY: Staking $${recoveryStake.toFixed(2)} on #${stats.bestEntryDigit}`);
          }
        }
      }
    }
  }, [
    trades,
    botConfig,
    addBotLog,
    updateBotStatus,
    isRecovering,
    consecutiveLosses,
    symbol.id,
    symbol.name,
    onSelectSymbol,
    findBestRecoveryMarket,
    stats.bestEntryDigit
  ]);

  // Autonomous Bot Strike Engine on Incoming Ticks
  useEffect(() => {
    if (!botActive || !currentTick || pendingTrade) return;

    // Cooldown check
    if (currentTick.epoch <= lastCooldownTickEpochRef.current) return;
    if (ticks.length < 15) return; // Need sufficient tick buffer for statistical significance

    // In recovery mode, require strict discipline: Prime Optimal Digit ONLY
    const isPrimeOptimal = currentTick.lastDigit === stats.bestEntryDigit;
    const isApprovedSecondary =
      !isRecovering &&
      botConfig.entrySensitivity === 'optimal_plus_secondary' &&
      stats.secondaryEntryDigits.includes(currentTick.lastDigit);

    const digitEdge =
      stats.entryDigitsRanked.find((d) => d.entryDigit === currentTick.lastDigit)?.oneTickWinRate ?? 80;

    const primeEdge =
      stats.entryDigitsRanked.find((d) => d.entryDigit === stats.bestEntryDigit)?.oneTickWinRate ?? 88;

    const isSafeCondition =
      stats.conditionStatus === 'PRIME' ||
      stats.conditionStatus === 'FAVORABLE' ||
      stats.safeWindowScore >= 70;

    // Avoid striking immediately after an 8 or 9 breach if streak is 0
    const notDirectBreachShock = stats.currentStreak >= 1 || currentTick.lastDigit < 7;

    const qualifies =
      (isPrimeOptimal || isApprovedSecondary) &&
      digitEdge >= botConfig.minWinRate &&
      currentTick.lastDigit < 8 &&
      isSafeCondition &&
      notDirectBreachShock;

    if (qualifies && currentTick.epoch !== lastBotStrikeEpochRef.current) {
      lastBotStrikeEpochRef.current = currentTick.epoch;

      const stakeToUse =
        botConfig.stakeStrategy === 'recovery' ? currentBotStake : botConfig.baseStake;
      const sigId = isRecovering
        ? `BOT_SIG_RECOVERY_${Date.now()}_U8_1T`
        : `BOT_SIG_${Date.now()}_U8_1T`;

      const sig: PrecisionSignal = {
        id: sigId,
        timestamp: currentTick.epoch,
        symbol: symbol.id,
        contractType: 'DIGITUNDER',
        direction: 'UNDER',
        predictedDigit: 8,
        barrier: 8,
        confidence: parseFloat(stats.projectedAccuracy.toFixed(1)),
        confluenceScore: stats.safeWindowScore,
        isUltraAccuracy: stats.projectedAccuracy >= 95.0,
        entryQuote: currentTick.quote,
        durationTicks: 1, // STRICTLY 1 TICK
        targetDurationSeconds: 2,
        confluenceFactors: stats.confluenceChecks,
        reason: isRecovering
          ? `Under 8 Sniper Bot (RECOVERY): Auto-Strike on ${symbol.name} Prime Digit #${currentTick.lastDigit} (${digitEdge}% win rate, recovery stake $${stakeToUse.toFixed(2)})`
          : `Under 8 Sniper Bot: 1-Tick Auto Strike on Digit #${currentTick.lastDigit} (${digitEdge}% win rate)`,
        status: 'PENDING'
      };

      lastBotSignalIdRef.current = sigId;
      updateBotStatus(
        isRecovering
          ? `RECOVERY STRIKE ON #${currentTick.lastDigit} ($${stakeToUse.toFixed(2)})`
          : `STRIKING ON DIGIT #${currentTick.lastDigit} ($${stakeToUse.toFixed(2)})`
      );
      addBotLog(
        'strike',
        isRecovering
          ? `🔥 RECOVERY STRIKE! Auto-buying 1-Tick contract on ${symbol.name} at Prime Digit #${currentTick.lastDigit} (${digitEdge}% win rate) with recovery stake $${stakeToUse.toFixed(2)}...`
          : `⚡ BOT STRIKE! Current tick #${currentTick.lastDigit} matches entry edge (${digitEdge}% win rate). Auto-firing 1-Tick contract ($${stakeToUse.toFixed(2)})...`
      );

      onExecuteTrade(sig, stakeToUse);
    } else if (botActive && !pendingTrade) {
      if (isRecovering) {
        updateBotStatus(
          `RECOVERY HUNT (${symbol.name}): Waiting for Prime #${stats.bestEntryDigit} (${primeEdge.toFixed(1)}%) | Stake: $${currentBotStake.toFixed(2)}`
        );
      } else {
        updateBotStatus(
          `ANALYZING ${symbol.name}: Waiting for Digit #${stats.bestEntryDigit} (${primeEdge.toFixed(1)}%)`
        );
      }
    }
  }, [
    botActive,
    currentTick?.epoch,
    currentTick?.lastDigit,
    currentTick?.quote,
    ticks.length,
    pendingTrade,
    isRecovering,
    botConfig.mode,
    botConfig.entrySensitivity,
    botConfig.stakeStrategy,
    botConfig.baseStake,
    botConfig.minWinRate,
    currentBotStake,
    stats.bestEntryDigit,
    stats.secondaryEntryDigits,
    stats.entryDigitsRanked,
    stats.conditionStatus,
    stats.projectedAccuracy,
    stats.safeWindowScore,
    stats.confluenceChecks,
    stats.currentStreak,
    symbol?.id,
    symbol?.name,
    topMarket?.symbol?.id,
    topMarket?.score,
    onSelectSymbol,
    onExecuteTrade,
    addBotLog,
    updateBotStatus
  ]);

  // Handlers for instant 1-tick Under 8 trade execution
  const handleInstantTrade = (customReason?: string) => {
    if (!currentTick || pendingTrade) return;
    
    const sig: PrecisionSignal = {
      id: `SIG_${Date.now()}_U8_1T`,
      timestamp: currentTick.epoch,
      symbol: symbol.id,
      contractType: 'DIGITUNDER',
      direction: 'UNDER',
      predictedDigit: 8,
      barrier: 8,
      confidence: parseFloat(stats.projectedAccuracy.toFixed(1)),
      confluenceScore: stats.safeWindowScore,
      isUltraAccuracy: stats.projectedAccuracy >= 95.0,
      entryQuote: currentTick.quote,
      durationTicks: 1, // STRICTLY 1 TICK
      targetDurationSeconds: 2,
      confluenceFactors: stats.confluenceChecks,
      reason: customReason || `1-Tick execution on Digit Under 8: Entry digit #${currentDigit} (${stats.oneTickWinRateForCurrentDigit}% win rate)`,
      status: 'PENDING'
    };

    onExecuteTrade(sig, stakeAmount);
  };

  // Compounding calculation: standard Deriv Under 8 payout is ~23.5%
  const payoutMultiplier = 0.235;
  const compoundingSchedule = useMemo(() => {
    const steps = [];
    let currentStake = stakeAmount;
    let cumProfit = 0;

    for (let i = 1; i <= 5; i++) {
      const profit = currentStake * payoutMultiplier;
      cumProfit += profit;
      const totalReturn = currentStake + profit;
      steps.push({
        step: i,
        stake: currentStake,
        stepProfit: profit,
        cumProfit: cumProfit,
        nextCompoundedStake: totalReturn,
        cumulativeRoi: (cumProfit / stakeAmount) * 100
      });
      currentStake = parseFloat(totalReturn.toFixed(2));
    }
    return steps;
  }, [stakeAmount]);

  // Status configuration
  const statusConfig = {
    PRIME: {
      badgeBg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
      pillBg: 'bg-emerald-500 text-slate-950',
      title: 'PRIME BUY ZONE (95%+ VERIFIED)',
      desc: 'Digits 8 & 9 are actively suppressed. Run-length and Markov transition risk are in the optimal safety band.',
      icon: Sparkles
    },
    FAVORABLE: {
      badgeBg: 'bg-teal-500/20 border-teal-500/40 text-teal-400',
      pillBg: 'bg-teal-500 text-slate-950',
      title: 'FAVORABLE (88% - 94% EDGE)',
      desc: 'Market is leaning towards digits 0-7 with acceptable upper-boundary suppression.',
      icon: CheckCircle2
    },
    COOLDOWN: {
      badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
      pillBg: 'bg-amber-500 text-slate-950',
      title: 'COOLDOWN / HOLD (RECENT 8/9 BREACH)',
      desc: 'A breach digit (8 or 9) occurred within the last 1-2 ticks. Wait for cluster dispersion before re-entering.',
      icon: Clock
    },
    HIGH_RISK: {
      badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
      pillBg: 'bg-rose-500 text-slate-950',
      title: 'HIGH RISK (UPPER DIGIT CLUSTER)',
      desc: 'Combined 8 & 9 frequency exceeds 24% or price velocity has a strong upward jump bias.',
      icon: AlertTriangle
    },
    NEUTRAL: {
      badgeBg: 'bg-slate-800 border-slate-700 text-slate-300',
      pillBg: 'bg-slate-700 text-slate-200',
      title: 'STANDARD MARKET (80.0% BASELINE)',
      desc: 'Market matches standard Poisson distribution. Confluence filters are monitoring for an edge.',
      icon: Info
    }
  }[stats.conditionStatus];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* SCANNER NOTIFICATION BANNER */}
      {scannerNotification && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{scannerNotification}</span>
          </div>
          <button 
            onClick={() => setScannerNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* BEST MARKET RADAR HEADER */}
      {topMarket && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          {/* Top Control Bar: Locked Market Status & Manual Rescan Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono text-emerald-300 font-bold">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>LOCKED MARKET: {symbol.name}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Tool stays with this market until you click Rescan (Evaluated at {lastScannedTime})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="header-rescan-best-market-btn"
                onClick={handleRescanBestMarket}
                disabled={isScanning}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                title="Scan all synthetic volatility markets, switch to the #1 market, and lock onto it until rescan"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning Markets...' : 'Rescan Best Market'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                    #1 BEST MARKET FOR UNDER 8
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {topMarket.volatilityLabel}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                  <span>{topMarket.symbol.name}</span>
                  {isCurrentTopMarket ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                      ACTIVE MARKET
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                      RECOMMENDED SWITCH
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300">
                  {topMarket.reason}
                </p>
              </div>
            </div>

            {/* Top Market Key Stats & Switch Action */}
            <div className="flex items-center gap-4 self-start md:self-center shrink-0">
              <div className="text-right font-mono">
                <div className="text-[10px] uppercase text-slate-400">1-Tick Entry Edge</div>
                <div className="text-base font-black text-emerald-400 flex items-center justify-end gap-1">
                  <span>Digit #{topMarket.bestEntryDigit}</span>
                  <span className="text-xs text-emerald-300 font-semibold">
                    ({topMarket.oneTickWinRateForBestDigit.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Under 8 Rate: <strong className="text-emerald-400">{topMarket.under8Percentage.toFixed(1)}%</strong> | Score: {topMarket.score}/100
                </div>
              </div>

              {!isCurrentTopMarket && onSelectSymbol ? (
                <button
                  onClick={handleRescanBestMarket}
                  disabled={isScanning}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>Switch &amp; Lock {topMarket.symbol.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Locked Active Market</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick-Switch Pills: Top 3 Ranked Markets */}
          {marketScanList.length >= 3 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase shrink-0 font-sans">Top Rankings:</span>
              {marketScanList.slice(0, 4).map((m, rankIdx) => {
                const isSelected = m.symbol.id === symbol.id;
                return (
                  <button
                    key={m.symbol.id}
                    onClick={() => {
                      onSelectSymbol?.(m.symbol);
                      setScannerNotification(`🔒 Locked onto ${m.symbol.name}. The tool will stay with this market until you rescan.`);
                      setTimeout(() => setScannerNotification(null), 5000);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 shrink-0 transition-all border ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className={`px-1 py-0.2 text-[9px] rounded font-black ${
                      rankIdx === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}>
                      #{rankIdx + 1}
                    </span>
                    <span>{m.symbol.name}</span>
                    <span className="text-emerald-400 font-bold">{m.score} pts</span>
                    <span className="text-slate-400 text-[10px]">(Digit #{m.bestEntryDigit})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADVISORY IF NOT ON BEST MARKET */}
      {!isCurrentTopMarket && topMarket && (
        <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700 text-slate-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Locked Market:</span> You are currently viewing{' '}
              <strong className="text-white">{symbol.name}</strong> (Score: {stats.safeWindowScore}/100). The tool will stay with this market until you click Rescan.
            </div>
          </div>
          <button
            onClick={handleRescanBestMarket}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 transition-colors flex items-center gap-1.5 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Rescan Best Market</span>
          </button>
        </div>
      )}

      {/* View Switcher: Terminal View vs Bot Mission Control vs Market Scanner Table */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            1-Tick Terminal &amp; Entry Radar
          </button>
          <button
            id="tab-bot-btn"
            onClick={() => setActiveTab('bot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'bot'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 ring-1 ring-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className={`w-3.5 h-3.5 ${botActive ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span>Under 8 Sniper Bot</span>
            {botActive ? (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-mono font-black uppercase">
                ACTIVE
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">
                AUTO
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Market Scanner ({marketScanList.length})
          </button>
        </div>

        {/* Right side controls: Window size switcher & Deriv Bot Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Deriv Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenDownloadBotModal}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1 transition-colors shadow-sm"
              title="Download official Under 8 Bot XML file for bot.deriv.com"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download Bot (.xml)</span>
              <span className="sm:hidden">.XML</span>
            </button>
            <button
              onClick={handleOpenLinkAccountModal}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-colors shadow-sm ${
                accountInfo.isAuthorized
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Link or manage your Deriv account token"
            >
              <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{accountInfo.isAuthorized ? (accountInfo.loginid ? `Linked (${accountInfo.loginid})` : 'Linked') : 'Link Deriv'}</span>
              <span className="sm:hidden">{accountInfo.isAuthorized ? 'Linked' : 'Link'}</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono hidden md:inline">|</span>

          {/* Sample Size Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Sample:</span>
            <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              {[25, 50, 100, 200].map((size) => (
                <button
                  key={size}
                  onClick={() => setWindowSize(size)}
                  className={`px-2 py-0.5 text-xs font-mono font-semibold rounded transition-colors ${
                    windowSize === size
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size}t
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'bot' ? (
        /* DEDICATED UNDER 8 SNIPER BOT MISSION CONTROL */
        <Under8BotPanel
          botActive={botActive}
          onToggleBot={handleToggleBot}
          botStatus={botStatus}
          botStats={botStats}
          botConfig={botConfig}
          setBotConfig={setBotConfig}
          botLogs={botLogs}
          onClearLogs={() => setBotLogs([])}
          onResetStats={handleResetBotStats}
          symbol={symbol}
          bestEntryDigit={stats.bestEntryDigit}
          bestDigitWinRate={parseFloat((stats.entryDigitsRanked.find(d => d.entryDigit === stats.bestEntryDigit)?.oneTickWinRate ?? 88).toFixed(1))}
          currentDigit={currentDigit}
          currentStake={currentBotStake}
          topMarketName={topMarket?.symbol?.name}
          isContractPending={Boolean(pendingTrade)}
          onRescanBestMarket={handleRescanBestMarket}
          isScanning={isScanning}
          accountInfo={accountInfo}
          onOpenDownloadBotModal={handleOpenDownloadBotModal}
          onOpenLinkAccountModal={handleOpenLinkAccountModal}
          isLiveExecutionEnabled={isLiveExecutionEnabled}
          onToggleLiveExecution={onToggleLiveExecution}
          onManualStrike={(stake) => handleInstantTrade(`Manual 1-Tick Strike ($${stake.toFixed(2)})`)}
          isRecovering={isRecovering}
          recoveryTargetSymbol={recoveryTargetSymbol}
        />
      ) : activeTab === 'scanner' ? (
        /* MARKET VOLATILITY SCANNER VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Synthetic Volatility Markets Scanner (Ranked for Under 8)
              </h3>
              <p className="text-xs text-slate-400">
                Click "Rescan All Markets" to evaluate all assets and lock onto the highest-scoring Under 8 market. The tool stays on that market until you rescan.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Locked: <strong className="text-white">{symbol.name}</strong></span>
              </div>
              <button
                type="button"
                id="scanner-rescan-all-btn"
                onClick={handleRescanBestMarket}
                disabled={isScanning}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs flex items-center gap-1.5 shadow transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning All...' : 'Rescan All Markets'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {marketScanList.map((m, index) => {
              const isSelected = m.symbol.id === symbol.id;
              const isTop = index === 0;

              return (
                <div
                  key={m.symbol.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isTop
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : isSelected
                        ? 'bg-slate-800/60 border-slate-700'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded ${
                          isTop ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[160px]">
                          {m.symbol.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {m.volatilityLabel}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        m.conditionStatus === 'PRIME'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : m.conditionStatus === 'FAVORABLE'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {m.conditionStatus}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 py-2 font-mono text-center text-xs border-y border-slate-800/60 my-2">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Under 8</div>
                      <div className="font-bold text-emerald-400">{m.under8Percentage.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">8 &amp; 9 Freq</div>
                      <div className={`font-bold ${m.combined89Frequency <= 14 ? 'text-emerald-300' : 'text-slate-300'}`}>
                        {m.combined89Frequency.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Safe Score</div>
                      <div className="font-bold text-white">{m.score}/100</div>
                    </div>
                  </div>

                  {/* Best Entry Digit for this market */}
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Best 1-Tick Entry Digit:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold">
                        #{m.bestEntryDigit}
                      </span>
                      <span>({m.oneTickWinRateForBestDigit.toFixed(1)}%)</span>
                    </span>
                  </div>

                  {/* Switch / Select button */}
                  <div className="mt-3">
                    {isSelected ? (
                      <div className="w-full py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Locked Active Market</span>
                      </div>
                    ) : onSelectSymbol ? (
                      <button
                        onClick={() => {
                          onSelectSymbol(m.symbol);
                          setScannerNotification(`🔒 Locked onto ${m.symbol.name} (Score: ${m.score}/100, Prime Digit #${m.bestEntryDigit}). Staying on this market until you rescan.`);
                          setTimeout(() => setScannerNotification(null), 5000);
                          setActiveTab('terminal');
                        }}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 hover:border-emerald-400"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Select &amp; Lock Market</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TERMINAL VIEW: 1-TICK ENTRY POINT RADAR & EXECUTION */
        <>
          {/* PROMINENT 1-TICK ENTRY POINT RADAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    1-Tick Entry Point Digit Radar
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated Markov transition probability: when the trigger tick ends in this digit, what is the win rate on the very next tick?
                  </p>
                </div>
              </div>

              {/* Controls: Rescan Best Market & Auto-strike toggle */}
              <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                <button
                  type="button"
                  id="radar-rescan-best-btn"
                  onClick={handleRescanBestMarket}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow"
                  title="Rescan all synthetic volatility markets for the best Under 8 score and lock onto it"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Rescan Best Market'}</span>
                </button>

                <button
                  type="button"
                  id="radar-auto-strike-toggle-btn"
                  onClick={handleToggleBot}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                    botActive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${botActive ? 'animate-pulse' : ''}`} />
                  <span>Auto-Strike Bot (1-Tick): {botActive ? 'ACTIVE' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Big Entry Digit Showcase Banner */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Primary Optimal Digit Box (5 cols) */}
              <div className="md:col-span-5 p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-850 border border-emerald-500/50 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Optimal 1-Tick Entry Digit
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-mono font-black text-white">
                      Digit #{stats.bestEntryDigit}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-300 font-mono mt-1 font-semibold">
                    1-Tick Win Rate: {(stats.entryDigitsRanked.find(d => d.entryDigit === stats.bestEntryDigit)?.oneTickWinRate ?? 96.5).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Breach Risk to 8/9: {(stats.entryDigitsRanked.find(d => d.entryDigit === stats.bestEntryDigit)?.riskTo8or9 ?? 3.5).toFixed(1)}%
                  </div>
                </div>

                {/* Big Visual Digit Badge */}
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl font-mono font-black text-emerald-300 shadow-lg shadow-emerald-500/20">
                  {stats.bestEntryDigit}
                </div>
              </div>

              {/* Secondary & Avoid Digits (7 cols) */}
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Secondary Approved Entry Digits */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] font-mono text-teal-400 uppercase font-bold mb-1.5">
                    Secondary Entry Digits (≥86% Edge)
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {stats.secondaryEntryDigits.map((d) => {
                      const rate = stats.entryDigitsRanked.find(item => item.entryDigit === d)?.oneTickWinRate;
                      return (
                        <span
                          key={d}
                          className="px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 font-mono font-bold text-xs"
                        >
                          Digit #{d} ({rate?.toFixed(0)}%)
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Viable alternative trigger points when prime digit #{stats.bestEntryDigit} is resting.
                  </p>
                </div>

                {/* Avoid / Breach Digits */}
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <div className="text-[10px] font-mono text-rose-400 uppercase font-bold mb-1.5">
                    Avoid / High-Risk Digits
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {stats.avoidDigits.map((d) => (
                      <span
                        key={d}
                        className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs"
                      >
                        Digit #{d}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    High historical Markov jump probability directly into digits 8 or 9.
                  </p>
                </div>
              </div>
            </div>

            {/* LIVE ENTRY TRIGGER STATUS RADAR WITH FULL BOT INTEGRATION */}
            <div className={`p-4 rounded-xl border transition-all ${
              botActive
                ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-400/50'
                : stats.currentDigitIsOptimalEntry
                  ? 'bg-emerald-500/25 border-emerald-400 shadow-lg shadow-emerald-500/20 animate-pulse'
                  : currentDigit === 8 && stats.isDigit8EntryReady
                    ? 'bg-emerald-500/25 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : stats.currentDigitIsSecondaryEntry
                      ? 'bg-teal-500/20 border-teal-500/40'
                      : currentDigit >= 8
                        ? 'bg-rose-500/20 border-rose-500/40'
                        : 'bg-slate-800/60 border-slate-700/60'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl border shrink-0 transition-all ${
                    botActive
                      ? stats.currentDigitIsOptimalEntry
                        ? 'bg-emerald-400 text-slate-950 border-emerald-200 animate-bounce'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                      : stats.currentDigitIsOptimalEntry
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                        : currentDigit === 8 && stats.isDigit8EntryReady
                          ? 'bg-emerald-400 text-slate-950 border-emerald-200 shadow-md animate-pulse'
                          : stats.currentDigitIsSecondaryEntry
                            ? 'bg-teal-500 text-slate-950 border-teal-300'
                            : currentDigit >= 8
                              ? 'bg-rose-500 text-slate-950 border-rose-300'
                              : 'bg-slate-700 text-white border-slate-600'
                  }`}>
                    {currentDigit}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white uppercase tracking-wide flex items-center gap-2 flex-wrap">
                      <span>Current Tick Digit: #{currentDigit}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 ${
                        botActive
                          ? stats.currentDigitIsOptimalEntry
                            ? 'bg-emerald-400 text-slate-950 shadow-md animate-pulse'
                            : 'bg-emerald-500 text-slate-950 shadow'
                          : stats.currentDigitIsOptimalEntry
                            ? 'bg-emerald-500 text-slate-950'
                            : currentDigit === 8 && stats.isDigit8EntryReady
                              ? 'bg-emerald-400 text-slate-950 font-black'
                              : stats.currentDigitIsSecondaryEntry
                                ? 'bg-teal-500 text-slate-950'
                                : currentDigit >= 8
                                  ? 'bg-rose-500 text-slate-950'
                                  : 'bg-slate-700 text-slate-200'
                      }`}>
                        {botActive ? (
                          <>
                            <Bot className="w-3 h-3 shrink-0" />
                            <span>
                              {stats.currentDigitIsOptimalEntry
                                ? '🎯 BOT AUTO-STRIKING NOW'
                                : `🤖 BOT SNIPING DIGIT #${stats.bestEntryDigit}`}
                            </span>
                          </>
                        ) : stats.currentDigitIsOptimalEntry ? (
                          '🎯 STRIKE POINT READY'
                        ) : currentDigit === 8 && stats.isDigit8EntryReady ? (
                          '🎯 DIGIT 8 ENTRY POINT ACTIVE'
                        ) : stats.currentDigitIsSecondaryEntry ? (
                          '⚡ APPROVED ENTRY'
                        ) : currentDigit >= 8 ? (
                          '⛔ BREACH COOLDOWN'
                        ) : (
                          '⏳ WAITING FOR ENTRY DIGIT'
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">
                      {botActive ? (
                        <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            Under 8 Bot Active: Autonomously firing 1-tick contract the instant tick #{stats.bestEntryDigit} appears ({(stats.entryDigitsRanked.find(d => d.entryDigit === stats.bestEntryDigit)?.oneTickWinRate ?? 96.5).toFixed(1)}% edge). Session P/L: <strong className={botStats.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}>${botStats.netProfit.toFixed(2)}</strong> ({botStats.wins}W / {botStats.losses}L).
                          </span>
                        </span>
                      ) : (
                        stats.entryStatusMessage
                      )}
                    </p>
                  </div>
                </div>

                {/* Interactive Action Controls: Bot Switch + Manual Strike Button */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                  {/* Master Bot Switch Button */}
                  <button
                    id="radar-bot-toggle-btn"
                    type="button"
                    onClick={handleToggleBot}
                    className={`px-4 py-2.5 rounded-xl font-mono font-black text-xs transition-all flex items-center gap-2 shadow-lg ${
                      botActive
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400/60 animate-pulse'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 ring-1 ring-emerald-300'
                    }`}
                  >
                    {botActive ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>STOP BOT</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        <span>START UNDER 8 BOT</span>
                      </>
                    )}
                  </button>

                  {/* Instant Manual Strike Button */}
                  <button
                    disabled={Boolean(pendingTrade)}
                    onClick={() => handleInstantTrade(
                      stats.currentDigitIsOptimalEntry
                        ? `Optimal Entry Digit #${currentDigit} Strike (1-Tick)`
                        : `1-Tick Under 8 execution on digit #${currentDigit}`
                    )}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs font-mono transition-all flex items-center gap-2 ${
                      stats.currentDigitIsOptimalEntry
                        ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    } disabled:opacity-50`}
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>STRIKE 1-TICK NOW (+${(((botActive ? currentBotStake : stakeAmount)) * payoutMultiplier).toFixed(2)})</span>
                  </button>

                  {/* Open Mission Control Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('bot')}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
                    title="Open Full Bot Parameters & Telemetry Log"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 0-9 Transition Probability Grid */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>1-Tick Under 8 Win Rate per Trigger Digit (Markov Transitions)</span>
                <span className="font-mono text-[10px] text-slate-400">Target: Exit &lt; 8 on Next Tick</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 font-mono">
                {stats.entryDigitsRanked.map((item) => {
                  const isCurrent = currentDigit === item.entryDigit;
                  const isOptimal = item.entryDigit === stats.bestEntryDigit;
                  const isSecondary = stats.secondaryEntryDigits.includes(item.entryDigit);
                  const isAvoid = stats.avoidDigits.includes(item.entryDigit);

                  return (
                    <div
                      key={item.entryDigit}
                      className={`p-2.5 rounded-xl border text-center relative transition-all ${
                        isOptimal
                          ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400'
                          : isSecondary
                            ? 'bg-teal-500/15 border-teal-500/40'
                            : isAvoid
                              ? 'bg-rose-950/25 border-rose-500/40'
                              : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-amber-400 text-slate-950 px-1 rounded">
                          TICK
                        </span>
                      )}
                      
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span className={isOptimal ? 'text-emerald-300' : isAvoid ? 'text-rose-400' : 'text-slate-300'}>
                          #{item.entryDigit}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {item.sampleCount}x
                        </span>
                      </div>

                      <div className="text-sm font-black text-white my-1">
                        {item.oneTickWinRate.toFixed(1)}%
                      </div>

                      <div className={`text-[8px] font-bold uppercase rounded py-0.5 ${
                        isOptimal
                          ? 'bg-emerald-500 text-slate-950'
                          : isSecondary
                            ? 'bg-teal-500/30 text-teal-300'
                            : isAvoid
                              ? 'bg-rose-500/30 text-rose-300'
                              : 'bg-slate-700 text-slate-400'
                      }`}>
                        {isOptimal ? 'OPTIMAL' : isSecondary ? 'SAFE' : isAvoid ? 'AVOID' : 'NEUTRAL'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1-Click Interactive Execution Panel & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 1-Click Trade Launcher (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    Strictly 1-Tick Fast Launcher
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    1 TICK ONLY
                  </span>
                </div>

                {/* Current Tick Live Badge */}
                <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Live Market &amp; Price</div>
                    <div className="text-xs font-bold text-slate-200">{symbol?.name || 'Volatility Index'}</div>
                    <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                      {currentTick ? currentTick.quote.toFixed(symbol?.pipSize ?? 2) : '1520.45'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Trigger Digit</div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-base ${
                        stats.currentDigitIsOptimalEntry
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : currentDigit < 8 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      }`}>
                        {currentDigit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls: Duration (Strictly 1 Tick Locked) & Stake */}
                <div className="space-y-3 mt-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Contract Duration
                      </label>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                        STRICTLY 1 TICK (LOCKED)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-mono flex items-center justify-between">
                      <span className="text-white font-bold">1 Tick Execution</span>
                      <span className="text-slate-400 text-[11px]">Instant 1-Second Resolution</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Stake Amount ($)
                      </label>
                      <span className="text-xs font-mono text-teal-400 font-semibold">
                        Payout: ${(stakeAmount * (1 + payoutMultiplier)).toFixed(2)} (+${(stakeAmount * payoutMultiplier).toFixed(2)})
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {[5, 10, 25, 50, 100].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setStakeAmount(amt)}
                          className={`py-1 rounded-lg text-xs font-mono transition-colors ${
                            stakeAmount === amt
                              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Launch Button */}
              <div className="pt-2">
                {pendingTrade ? (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Evaluating 1-tick resolution ({pendingTrade.ticksElapsed}/1t)...</span>
                    </div>
                    <span className="font-bold">${pendingTrade.stake} Staked</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleInstantTrade()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    EXECUTE 1-TICK DIGIT UNDER 8 (+${(stakeAmount * payoutMultiplier).toFixed(2)})
                  </button>
                )}

                <p className="text-[10px] text-slate-500 text-center font-mono mt-2">
                  Duration strictly 1-tick. Settle directly on next incoming Deriv tick.
                </p>
              </div>
            </div>

            {/* Right: Real-time Confluence & Edge Breakdown (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Under 8 Statistical Edge Metrics
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Sample: {stats.sampleSize} Ticks
                </span>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                {/* Safe Zone (0-7) */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase">Under 8 Freq</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    {stats.under8Percentage.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {stats.under8Count} / {stats.sampleSize} ticks
                  </div>
                </div>

                {/* Danger Zone (8 & 9) */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase">Combined 8 &amp; 9</div>
                  <div className={`text-lg font-black mt-0.5 ${
                    stats.combined89Frequency <= 14 ? 'text-emerald-400' : stats.combined89Frequency > 22 ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {stats.combined89Frequency.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Norm: 20.0% ({stats.combined89Frequency <= 14 ? 'Drought' : 'Active'})
                  </div>
                </div>

                {/* Current Streak */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase">Under 8 Streak</div>
                  <div className="text-lg font-black text-teal-300 mt-0.5">
                    {stats.currentStreak} Ticks
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Max: {stats.maxStreak}t (Avg: {stats.avgStreak.toFixed(1)}t)
                  </div>
                </div>

                {/* Markov Jump to 8/9 */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase">Markov Jump Risk</div>
                  <div className={`text-lg font-black mt-0.5 ${
                    stats.markovJumpRiskTo89 <= 10 ? 'text-emerald-400' : stats.markovJumpRiskTo89 > 20 ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    {stats.markovJumpRiskTo89.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    From digit {currentDigit} to 8/9
                  </div>
                </div>
              </div>

              {/* Visual Ratio Bar: Safe Zone (0-7) vs Danger Zone (8-9) */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Winning Digits 0, 1, 2, 3, 4, 5, 6, 7 ({stats.under8Percentage.toFixed(1)}%)
                  </span>
                  <span className="text-rose-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Losing Digits 8 &amp; 9 ({stats.overOrEqual8Percentage.toFixed(1)}%)
                  </span>
                </div>

                <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
                  <div
                    style={{ width: `${stats.under8Percentage}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  />
                  <div
                    style={{ width: `${stats.overOrEqual8Percentage}%` }}
                    className="h-full bg-rose-500 transition-all duration-300"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Digit 8: <strong className="text-slate-200">{stats.digit8Percentage.toFixed(1)}%</strong> ({stats.digit8Count} hits)</span>
                  <span>Last 8: <strong className="text-slate-200">{stats.ticksSinceLast8}t ago</strong></span>
                  <span>Last 9: <strong className="text-slate-200">{stats.ticksSinceLast9}t ago</strong></span>
                  <span>Digit 9: <strong className="text-slate-200">{stats.digit9Percentage.toFixed(1)}%</strong> ({stats.digit9Count} hits)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Chronological Digit Tape */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Real-Time 1-Tick Sequence Stream
                </h3>
                <p className="text-xs text-slate-400">
                  Chronological tape of last 30 tick digits. Green (&lt;8) indicates successful Under 8 exit, red (&ge;8) marks breach.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Safe (&lt;8)
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Breach (8,9)
                </span>
              </div>
            </div>

            {/* Scrolling Tape */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 font-mono">
              {stats.recentSequence.map((seq, idx) => {
                const isLatest = idx === stats.recentSequence.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-8 h-12 rounded-lg border transition-all ${
                      seq.isUnder8
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-500/60 text-rose-400 font-bold animate-pulse'
                    } ${isLatest ? 'ring-2 ring-emerald-400 scale-105' : ''}`}
                    title={`Digit ${seq.digit} @ ${seq.quote}`}
                  >
                    <span className="text-xs font-bold">{seq.digit}</span>
                    <span className="text-[8px] opacity-70">
                      {seq.isUnder8 ? '✓' : '✗'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Official Deriv DBot XML Export & Direct Account Linking Modal */}
      <DerivBotModal
        isOpen={isDerivBotModalOpen}
        onClose={() => setIsDerivBotModalOpen(false)}
        symbol={symbol}
        botConfig={botConfig}
        accountInfo={accountInfo}
        apiToken={apiToken}
        appId={appId}
        onSaveConfig={onSaveConfig}
        bestEntryDigit={stats.bestEntryDigit}
        isLiveExecutionEnabled={isLiveExecutionEnabled}
        onToggleLiveExecution={onToggleLiveExecution}
        defaultTab={derivBotModalDefaultTab}
      />
    </div>
  );
};
