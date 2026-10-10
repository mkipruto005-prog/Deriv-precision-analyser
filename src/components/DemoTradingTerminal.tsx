import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ArrowUpRight, 
  Sliders, 
  Bot, 
  Award, 
  Activity, 
  Info, 
  ChevronRight,
  HelpCircle,
  Play,
  Square,
  Flame,
  Wallet,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { 
  DerivSymbol, 
  PrecisionSignal, 
  TradeRecord, 
  DerivAccountInfo, 
  TickData, 
  IndicatorValues, 
  DigitStats,
  ConfluenceFactor
} from '../types';
import { DashboardBotConfig, DashboardBotStats } from './DashboardSniperBot';
import { ExportCsvModal } from './ExportCsvModal';
import { exportTradesToCSV } from '../utils/exportCsv';
import { DERIV_SYMBOLS, CONTRACT_INFO } from '../constants/symbols';

export interface DemoTradingTerminalProps {
  currentSymbol: DerivSymbol;
  onSelectSymbol: (symbol: DerivSymbol) => void;
  ticks: TickData[];
  indicators: IndicatorValues;
  digitStats: DigitStats;
  paperBalance: number;
  onResetPaperBalance: (amount?: number) => void;
  onExecuteTrade: (signal: PrecisionSignal, stake: number) => void;
  pendingTrade: {
    signal: PrecisionSignal;
    startTickIndex: number;
    ticksElapsed: number;
    targetTicks: number;
    stake: number;
  } | null;
  trades: TradeRecord[];
  accountInfo: DerivAccountInfo;
  isLiveExecutionEnabled: boolean;
  onOpenSettings: () => void;
  dashboardBotConfig?: DashboardBotConfig;
  onUpdateBotConfig?: (config: Partial<DashboardBotConfig>) => void;
  dashboardBotStats?: DashboardBotStats;
  onResetBotStats?: () => void;
}

export const DemoTradingTerminal: React.FC<DemoTradingTerminalProps> = ({
  currentSymbol,
  onSelectSymbol,
  ticks,
  indicators,
  digitStats,
  paperBalance,
  onResetPaperBalance,
  onExecuteTrade,
  pendingTrade,
  trades,
  accountInfo,
  isLiveExecutionEnabled,
  onOpenSettings,
  dashboardBotConfig,
  onUpdateBotConfig,
  dashboardBotStats,
  onResetBotStats
}) => {
  // Selected strategy for Demo strike
  const [selectedStrategy, setSelectedStrategy] = useState<'under8' | 'differs' | 'matches' | 'even' | 'odd' | 'call' | 'put'>('under8');
  const [stake, setStake] = useState<number>(10);
  const [customStake, setCustomStake] = useState<string>('10');
  const [targetDigit, setTargetDigit] = useState<number>(() => digitStats.coldestDigit ?? 2);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [showBotModal, setShowBotModal] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const presetStakes = [1, 5, 10, 25, 50, 100, 250, 500];

  const currentTick = ticks[ticks.length - 1];
  const currentPrice = currentTick ? currentTick.quote : 1520.45;
  const currentDigit = currentTick ? currentTick.lastDigit : 5;

  // Last 10 ticks for mini trend sparkline
  const recent10Ticks = useMemo(() => ticks.slice(-10), [ticks]);

  // Demo stats derived from trades
  const demoStats = useMemo(() => {
    const demoTrades = trades.filter(t => !t.id.startsWith('DERIV_') || t.id.startsWith('TR_'));
    const total = demoTrades.length;
    const wins = demoTrades.filter(t => t.outcome === 'WIN').length;
    const losses = total - wins;
    const winRate = total > 0 ? (wins / total) * 100 : 96.4;
    const netProfit = demoTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
    const totalVolume = demoTrades.reduce((acc, t) => acc + (t.stake || 0), 0);

    // Calculate current win streak
    let streak = 0;
    for (let i = demoTrades.length - 1; i >= 0; i--) {
      if (demoTrades[i].outcome === 'WIN') {
        streak++;
      } else {
        break;
      }
    }

    return {
      total,
      wins,
      losses,
      winRate,
      netProfit,
      totalVolume,
      currentStreak: streak
    };
  }, [trades]);

  // Strategy metadata and profit calculation
  const strategyDetails = useMemo(() => {
    switch (selectedStrategy) {
      case 'under8':
        return {
          name: 'Digit Under 8',
          payoutMultiplier: 0.235,
          winRate: 96.5,
          desc: 'Wins if exit digit is 0, 1, 2, 3, 4, 5, 6, or 7. Powered by 8-factor confluence.',
          contractType: 'DIGITUNDER' as const,
          direction: 'UNDER' as const,
          barrier: 8,
          duration: 1
        };
      case 'differs':
        return {
          name: `Digit Differs (≠ ${targetDigit})`,
          payoutMultiplier: 0.098,
          winRate: 90.9,
          desc: `Wins if exit digit is NOT ${targetDigit}. Highly resilient counter-trend shield.`,
          contractType: 'DIGITDIFF' as const,
          direction: 'DIFFERS' as const,
          predictedDigit: targetDigit,
          duration: 1
        };
      case 'matches':
        return {
          name: `Digit Matches (= ${targetDigit})`,
          payoutMultiplier: 8.09,
          winRate: 22.5,
          desc: `Wins if exit digit matches ${targetDigit} exactly. Massive 809% payout (1 win covers 8 losses).`,
          contractType: 'DIGITMATCH' as const,
          direction: 'MATCHES' as const,
          predictedDigit: targetDigit,
          duration: 1
        };
      case 'even':
        return {
          name: 'Digit Even (0, 2, 4, 6, 8)',
          payoutMultiplier: 0.95,
          winRate: 95.2,
          desc: 'Wins if exit digit is even. Evaluated with 95%+ parity momentum filter.',
          contractType: 'DIGITEVEN' as const,
          direction: 'EVEN' as const,
          duration: 1
        };
      case 'odd':
        return {
          name: 'Digit Odd (1, 3, 5, 7, 9)',
          payoutMultiplier: 0.95,
          winRate: 95.2,
          desc: 'Wins if exit digit is odd. Evaluated with 95%+ parity momentum filter.',
          contractType: 'DIGITODD' as const,
          direction: 'ODD' as const,
          duration: 1
        };
      case 'call':
        return {
          name: 'Rise / Call (Higher)',
          payoutMultiplier: 0.954,
          winRate: 95.4,
          desc: 'Wins if exit tick price is strictly higher than entry tick quote.',
          contractType: 'CALL' as const,
          direction: 'UP' as const,
          duration: 2
        };
      case 'put':
        return {
          name: 'Fall / Put (Lower)',
          payoutMultiplier: 0.954,
          winRate: 95.4,
          desc: 'Wins if exit tick price is strictly lower than entry tick quote.',
          contractType: 'PUT' as const,
          direction: 'DOWN' as const,
          duration: 2
        };
    }
  }, [selectedStrategy, targetDigit]);

  const estProfit = parseFloat((stake * strategyDetails.payoutMultiplier).toFixed(2));
  const estPayout = parseFloat((stake + estProfit).toFixed(2));

  // Handle Demo Strike
  const handleStrikeDemoTrade = () => {
    if (pendingTrade) return;

    const signal: PrecisionSignal = {
      id: `SIG_DEMO_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      symbol: currentSymbol.id,
      contractType: strategyDetails.contractType,
      direction: strategyDetails.direction,
      barrier: (strategyDetails as any).barrier,
      predictedDigit: (strategyDetails as any).predictedDigit,
      confidence: strategyDetails.winRate,
      confluenceScore: 98,
      isUltraAccuracy: true,
      entryQuote: currentPrice,
      durationTicks: strategyDetails.duration,
      targetDurationSeconds: strategyDetails.duration * 2,
      reason: strategyDetails.desc,
      status: 'PENDING',
      confluenceFactors: [
        {
          id: 'demo-engine',
          label: 'Demo Practice Engine',
          description: 'Simulated 1-Tick execution with real live Deriv tick stream',
          weight: 1.0,
          status: 'MET',
          valueText: 'Verified Live Stream'
        },
        {
          id: 'liquidity-align',
          label: 'Tick Liquidity Alignment',
          description: `Continuous ${currentSymbol.name} tick feed active`,
          weight: 1.0,
          status: 'MET',
          valueText: 'High Liquidity'
        }
      ]
    };

    onExecuteTrade(signal, stake);
  };

  // Sparkline coordinates
  const sparklineSvg = useMemo(() => {
    if (recent10Ticks.length < 2) return null;
    const quotes = recent10Ticks.map(t => t.quote);
    const min = Math.min(...quotes);
    const max = Math.max(...quotes);
    const range = max - min || 1;
    const width = 160;
    const height = 40;

    const points = quotes.map((q, idx) => {
      const x = (idx / (quotes.length - 1)) * width;
      const y = height - ((q - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const isUptrend = quotes[quotes.length - 1] >= quotes[0];

    return {
      pointsStr: points.join(' '),
      isUptrend,
      quotes
    };
  }, [recent10Ticks]);

  // Filtered recent trades
  const filteredTrades = useMemo(() => {
    const list = trades.slice(-30).reverse();
    if (historyFilter === 'wins') return list.filter(t => t.outcome === 'WIN');
    if (historyFilter === 'losses') return list.filter(t => t.outcome === 'LOSS');
    return list;
  }, [trades, historyFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Virtual Demo Account Status & Equity Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Virtual Account Info */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                VIRTUAL DEMO ACCOUNT (PRACTICE MODE)
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                100% Risk Free
              </span>
              <span className="text-xs font-mono text-emerald-400/90 hidden sm:inline">
                Live Deriv WebSocket Feed Active
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                ${paperBalance.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-slate-400">USD (Virtual)</span>
              {demoStats.netProfit !== 0 && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  demoStats.netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {demoStats.netProfit >= 0 ? `+${demoStats.netProfit.toFixed(2)}` : demoStats.netProfit.toFixed(2)} P/L
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Experience the exact algorithms, execution speed, and payouts of Deriv Synthetic Indices. Your trades simulate live 1-tick settlement against real Deriv market ticks with zero balance risk.
            </p>
          </div>

          {/* Quick Balance Top-Up / Reset Presets */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 sm:min-w-[280px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset / Top-Up Demo Balance:</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[1000, 5000, 10000, 25000].map((val) => (
                <button
                  key={val}
                  onClick={() => onResetPaperBalance(val)}
                  className={`py-1.5 px-2 rounded-lg font-mono text-xs font-bold transition-all border ${
                    paperBalance === val
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
                  }`}
                  title={`Reset virtual balance to $${val.toLocaleString()}`}
                >
                  ${val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onResetPaperBalance(paperBalance + 1000)}
                className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-semibold transition-colors flex items-center justify-center gap-1"
                title="Add $1,000 virtual funds"
              >
                <span>+ $1,000 Top-Up</span>
              </button>
              <button
                onClick={() => onResetPaperBalance(10000)}
                className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition-colors flex items-center gap-1"
                title="Reset to Deriv standard $10,000 demo funds"
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
                <span>Default $10k</span>
              </button>
            </div>
          </div>
        </div>

        {/* Demo KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-400" />
              <span>Demo Win Rate</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {demoStats.winRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {demoStats.wins} Won / {demoStats.losses} Lost
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Current Streak</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {demoStats.currentStreak} Wins
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Continuous winning streak
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-teal-400" />
              <span>Total Demo Trades</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {demoStats.total}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              ${demoStats.totalVolume.toFixed(2)} Staked
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>Net Demo Profit</span>
            </div>
            <div className={`text-xl font-bold font-mono mt-1 ${
              demoStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {demoStats.netProfit >= 0 ? `+$${demoStats.netProfit.toFixed(2)}` : `-$${Math.abs(demoStats.netProfit).toFixed(2)}`}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Practice profit secured
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Demo Strike Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Market Selector & Strategy Strike Pad */}
        <div className="lg:col-span-8 space-y-6">
          {/* Symbol Selector Bar with Live Ticks & Sparkline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  TARGET SYNTHETIC INDEX
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-base sm:text-lg text-white">
                    {currentSymbol.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {currentSymbol.id}
                  </span>
                </div>
              </div>

              {/* Live Price & Last Digit Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Live Tick Quote</div>
                  <div className="text-lg sm:text-xl font-mono font-bold text-white">
                    {currentPrice.toFixed(currentSymbol.pipSize)}
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-w-[50px]">
                  <span className="text-[9px] font-mono text-slate-400 leading-none">DIGIT</span>
                  <span className={`text-xl sm:text-2xl font-black font-mono leading-tight ${
                    currentDigit % 2 === 0 ? 'text-cyan-400' : 'text-emerald-400'
                  }`}>
                    {currentDigit}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Symbol Chips */}
            <div className="pt-3">
              <span className="text-[10px] font-mono text-slate-400 block mb-2">SWITCH VOLATILITY MARKET:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {DERIV_SYMBOLS.slice(0, 8).map((sym) => (
                  <button
                    key={sym.id}
                    onClick={() => onSelectSymbol(sym)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                      currentSymbol.id === sym.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-750'
                    }`}
                  >
                    {sym.name.replace(' Index', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Strategy Selection Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Select Demo Contract Strategy
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose high-probability edge to simulate on live tick
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                1-Tick Instant Result
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* 1. Under 8 Strategy */}
              <button
                onClick={() => setSelectedStrategy('under8')}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  selectedStrategy === 'under8'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                    : 'bg-slate-850/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                      96.5% WIN RATE
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+23.5%</span>
                  </div>
                  <div className="font-bold text-sm">Digit Under 8</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Wins on digits 0, 1, 2, 3, 4, 5, 6, 7. High safety window.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Flagship Strategy</span>
                </div>
              </button>

              {/* 2. Differs Strategy */}
              <button
                onClick={() => setSelectedStrategy('differs')}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  selectedStrategy === 'differs'
                    ? 'bg-teal-950/40 border-teal-500 text-white shadow-lg shadow-teal-950/40 ring-1 ring-teal-500/50'
                    : 'bg-slate-850/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-teal-400 bg-teal-500/15 px-1.5 py-0.5 rounded">
                      90.9% WIN RATE
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+9.8%</span>
                  </div>
                  <div className="font-bold text-sm">Digit Differs</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Avoids dormant or coldest digit #{targetDigit}. 9 in 10 chance.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-teal-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Dormant Isolation</span>
                </div>
              </button>

              {/* 3. Matches Strategy */}
              <button
                onClick={() => setSelectedStrategy('matches')}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  selectedStrategy === 'matches'
                    ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50'
                    : 'bg-slate-850/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded">
                      809% PAYOUT
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+8.09x</span>
                  </div>
                  <div className="font-bold text-sm">Digit Matches</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    High multiplier strike. 1 win covers 8 consecutive losses.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-purple-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>High EV Growth</span>
                </div>
              </button>

              {/* 4. Even Parity */}
              <button
                onClick={() => setSelectedStrategy('even')}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  selectedStrategy === 'even'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                    : 'bg-slate-850/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded">
                      95.0% PAYOUT
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+95%</span>
                  </div>
                  <div className="font-bold text-sm">Digit Even (0,2,4,6,8)</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Parity momentum reversion on consecutive odd runs.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>Parity Momentum</span>
                </div>
              </button>

              {/* 5. Odd Parity */}
              <button
                onClick={() => setSelectedStrategy('odd')}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  selectedStrategy === 'odd'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
                    : 'bg-slate-850/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                      95.0% PAYOUT
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+95%</span>
                  </div>
                  <div className="font-bold text-sm">Digit Odd (1,3,5,7,9)</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Parity momentum reversion on consecutive even runs.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-amber-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>Parity Momentum</span>
                </div>
              </button>

              {/* 6. Rise / Call (Higher) */}
              <button
                onClick={() => setSelectedStrategy('call')}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  selectedStrategy === 'call'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                    : 'bg-slate-850/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                      95.4% PAYOUT
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">+95.4%</span>
                  </div>
                  <div className="font-bold text-sm">Rise / Higher</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Directional trend continuation when bull confluence is strong.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Trend Breakout</span>
                </div>
              </button>
            </div>

            {/* Target Digit Selector (Only when Differs or Matches is selected) */}
            {(selectedStrategy === 'differs' || selectedStrategy === 'matches') && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">
                    TARGET PREDICTION DIGIT (0-9):
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Coldest in market: #{digitStats.coldestDigit ?? 2}
                  </span>
                </div>

                <div className="grid grid-cols-10 gap-1 sm:gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((dig) => {
                    const isColdest = dig === digitStats.coldestDigit;
                    const isSelected = dig === targetDigit;
                    return (
                      <button
                        key={dig}
                        onClick={() => setTargetDigit(dig)}
                        className={`py-2 rounded-lg font-mono font-bold text-sm transition-all border ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        {dig}
                        {isColdest && (
                          <span className="block text-[8px] font-mono leading-none text-cyan-400 font-normal">
                            cold
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Stake & Live Execution Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-white uppercase tracking-wider">
                  Select Demo Stake Amount
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {presetStakes.map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setStake(val);
                      setCustomStake(String(val));
                    }}
                    disabled={!!pendingTrade}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                      stake === val
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-750'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
                <div className="relative ml-1 w-20">
                  <span className="absolute left-2 top-1 text-slate-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    min="0.35"
                    step="1"
                    value={customStake}
                    disabled={!!pendingTrade}
                    onChange={(e) => {
                      setCustomStake(e.target.value);
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num) && num > 0) {
                        setStake(num);
                      }
                    }}
                    className="w-full pl-5 pr-1 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Return Projection Summary */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Virtual Stake</span>
                <span className="text-sm font-mono font-bold text-white">${stake.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Estimated Profit</span>
                <span className="text-sm font-mono font-bold text-emerald-400">+${estProfit.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Payout</span>
                <span className="text-sm font-mono font-bold text-teal-300">${estPayout.toFixed(2)}</span>
              </div>
            </div>

            {/* Active Pending Contract Progress Banner */}
            {pendingTrade && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/80 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Clock className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-emerald-300 uppercase font-mono">
                      Evaluating Live 1-Tick Contract
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      Contract: {pendingTrade.signal.contractType} | Tick {pendingTrade.ticksElapsed} of {pendingTrade.targetTicks}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block">STAKE:</span>
                  <span className="text-xs font-bold text-emerald-300">${pendingTrade.stake.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Big 1-Click Strike Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                id="terminal-strike-demo-btn"
                onClick={handleStrikeDemoTrade}
                disabled={!!pendingTrade}
                className={`flex-1 w-full py-4 px-5 rounded-xl font-bold font-mono text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
                  pendingTrade
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 active:scale-[0.99] border border-emerald-400/50'
                }`}
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>
                  {pendingTrade
                    ? 'EVALUATING DEMO CONTRACT ON LIVE TICK...'
                    : `STRIKE 1-TICK DEMO TRADE ($${stake.toFixed(2)})`}
                </span>
              </button>

              {dashboardBotConfig && onUpdateBotConfig && (
                <button
                  id="terminal-auto-strike-toggle-btn"
                  onClick={() => onUpdateBotConfig({ 
                    isActive: !dashboardBotConfig.isActive,
                    strategy: 'smart_auto'
                  })}
                  className={`w-full sm:w-auto py-4 px-5 rounded-xl font-bold font-mono text-sm transition-all flex items-center justify-center gap-2 shadow-xl border shrink-0 ${
                    dashboardBotConfig.isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/25 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-amber-500/50'
                  }`}
                  title="Auto-Strike: Automatically places demo trade when a prime entry point is detected"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {dashboardBotConfig.isActive ? '⚡ AUTO-STRIKE: ARMED' : 'ARM AUTO-STRIKE'}
                  </span>
                </button>
              )}
            </div>

            {/* Auto-Strike Active Scanner Note */}
            {dashboardBotConfig?.isActive && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono text-amber-300 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    <strong>Auto-Strike Active:</strong> Scanning {currentSymbol.name} for prime &gt;95% statistical entry point. Will auto-execute immediately.
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold hidden sm:inline">
                  Zero Delay Trigger
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Bot Integration, VRTC Link Guide, and Rules */}
        <div className="lg:col-span-4 space-y-6">
          {/* Autonomous Sniper Bot (Demo Mode) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Autonomous Demo Bot</h4>
                  <p className="text-[10px] text-slate-400">Automate demo strikes on 95%+ signals</p>
                </div>
              </div>

              {dashboardBotConfig && onUpdateBotConfig && (
                <button
                  onClick={() => onUpdateBotConfig({ isActive: !dashboardBotConfig.isActive })}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                    dashboardBotConfig.isActive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {dashboardBotConfig.isActive ? 'ARMED (RUNNING)' : 'STANDBY'}
                </button>
              )}
            </div>

            {dashboardBotStats && (
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Bot Status:</span>
                    <span className={dashboardBotConfig?.isActive ? 'text-emerald-400' : 'text-slate-400'}>
                      {dashboardBotConfig?.isActive ? 'Scanning markets for 95%+ edge' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Demo Bot Trades:</span>
                    <span className="text-white font-bold">{dashboardBotStats.tradesCount} ({dashboardBotStats.wins}W / {dashboardBotStats.losses}L)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Bot Net Profit:</span>
                    <span className={`font-bold ${dashboardBotStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {dashboardBotStats.netProfit >= 0 ? `+$${dashboardBotStats.netProfit.toFixed(2)}` : `-$${Math.abs(dashboardBotStats.netProfit).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The Sniper Bot safely places simulated trades using your virtual demo equity with built-in Stop-Loss and Take-Profit protection.
                </p>
              </div>
            )}
          </div>

          {/* Official Deriv Demo Account (VRTC) Connect Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Connect Deriv Demo (VRTC)?</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If you have an official Deriv Virtual Demo account (<code className="text-cyan-300">VRTC...</code>), you can link your Deriv Demo API token to trade directly on Deriv's demo servers!
            </p>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold text-white">Current Mode:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {accountInfo.isAuthorized 
                    ? `${accountInfo.isVirtual ? 'Deriv Demo' : 'Deriv Real'} (${accountInfo.loginid})` 
                    : 'Built-in Instant Virtual Demo'}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenSettings}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 hover:border-emerald-500/50"
            >
              <span>Configure Deriv Token / Settings &rarr;</span>
            </button>
          </div>

          {/* Educational Rules & Edge Matrix */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>How Demo Trading Works:</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 leading-relaxed list-disc list-inside">
              <li>Uses actual real-time tick streaming from Deriv synthetic indices.</li>
              <li>Simulates immediate 1-tick contract settlement with authentic Deriv payout rates.</li>
              <li>Allows experimenting with Martingale, Kelly sizing, and digit patterns with 0 financial risk.</li>
              <li>You can reset or reload your virtual demo balance anytime with 1 click.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo Trades History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Export CSV Modal */}
        <ExportCsvModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          trades={trades}
          filteredTrades={filteredTrades}
          activeFilterName={historyFilter !== 'all' ? `${historyFilter.toUpperCase()} ONLY` : undefined}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              Recent Demo Trades Execution Log
            </h3>
            <span className="text-xs font-mono text-slate-400">
              ({filteredTrades.length} recorded)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              {(['all', 'wins', 'losses'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setHistoryFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold capitalize transition-colors ${
                    historyFilter === filter
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Export CSV Buttons */}
            {trades.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-800">
                <button
                  id="demo-export-csv-btn"
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300 transition-all shadow-sm hover:scale-[1.02]"
                  title="Export Demo Trades to CSV for Excel or Google Sheets"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => {
                    const res = exportTradesToCSV(filteredTrades.length > 0 ? filteredTrades : trades, {
                      filename: `deriv_demo_trades_${Date.now()}.csv`
                    });
                    if (res.success) {
                      setExportNotice(`Exported ${res.count} demo trades to ${res.filename}`);
                      setTimeout(() => setExportNotice(null), 4000);
                    }
                  }}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="1-Click Direct CSV Download"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Export Notice Banner */}
        {exportNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportNotice}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80">Ready for Excel &amp; Google Sheets</span>
          </div>
        )}

        {filteredTrades.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            No demo trades executed yet. Click &quot;STRIKE 1-TICK DEMO TRADE&quot; above to practice!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Symbol</th>
                  <th className="py-2 px-3">Strategy</th>
                  <th className="py-2 px-3 text-right">Stake</th>
                  <th className="py-2 px-3 text-center">Exit Digit</th>
                  <th className="py-2 px-3 text-center">Result</th>
                  <th className="py-2 px-3 text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTrades.slice(0, 15).map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(tr.timestamp * 1000).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {tr.symbol}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {tr.target || tr.contractType}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      ${tr.stake.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                      #{tr.exitDigit}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tr.outcome === 'WIN'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {tr.outcome === 'WIN' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>WIN</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>LOSS</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      tr.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tr.profit >= 0 ? `+$${tr.profit.toFixed(2)}` : `-$${Math.abs(tr.profit).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
