import React, { useState } from 'react';
import { 
  EvenOddStrategyId, 
  EvenOddStrategyConfig, 
  EvenOddAnalysis,
  DerivSymbol 
} from '../types';
import { 
  EVEN_ODD_STRATEGIES, 
  StrategyMeta 
} from '../services/evenOddAnalysis';
import { 
  ShieldCheck, 
  Flame, 
  TrendingUp, 
  Cpu, 
  Activity, 
  Repeat, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Zap, 
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface EvenOddStrategySelectorProps {
  currentSymbol: DerivSymbol;
  analysis: EvenOddAnalysis;
  config: EvenOddStrategyConfig;
  onConfigChange: (newConfig: EvenOddStrategyConfig) => void;
  onExecuteTrade: (target: 'EVEN' | 'ODD') => void;
  isAuthorized?: boolean;
}

export const EvenOddStrategySelector: React.FC<EvenOddStrategySelectorProps> = ({
  currentSymbol,
  analysis,
  config,
  onConfigChange,
  onExecuteTrade,
  isAuthorized
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showConfigDetails, setShowConfigDetails] = useState<boolean>(false);

  const activeStrategy: StrategyMeta = EVEN_ODD_STRATEGIES[config.strategyId] || EVEN_ODD_STRATEGIES.QUANT_CONFLUENCE;
  const backtest = analysis.strategyBacktest;
  const isSignalActive = analysis.isTradeSignalActive;

  const handleSelectStrategy = (id: EvenOddStrategyId) => {
    const meta = EVEN_ODD_STRATEGIES[id];
    onConfigChange({
      ...config,
      strategyId: id,
      minStreakTrigger: meta.recommendedMinStreak
    });
  };

  const getStrategyIcon = (id: EvenOddStrategyId) => {
    switch (id) {
      case 'QUANT_CONFLUENCE': return <Crosshair className="w-4 h-4 text-emerald-400" />;
      case 'STREAK_EXHAUSTION': return <Flame className="w-4 h-4 text-amber-400" />;
      case 'STREAK_MOMENTUM': return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      case 'MARKOV_CONDITIONAL': return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'Z_SCORE_ARBITRAGE': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'PING_PONG_OSCILLATION': return <Repeat className="w-4 h-4 text-rose-400" />;
      case 'SNIPER_PRESERVATION': return <ShieldCheck className="w-4 h-4 text-emerald-300" />;
      default: return <Crosshair className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl shadow-emerald-950/20 relative overflow-hidden backdrop-blur-md">
      {/* Subtle Background Radial Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mt-24" />

      {/* Top Bar: Active Strategy Header & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
            {getStrategyIcon(config.strategyId)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">
                Active Precision Strategy
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                {activeStrategy.accuracyGrade} Target
              </span>
              {config.strictFiltering && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Anti-Chop Filter Active
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{activeStrategy.name}</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              {activeStrategy.description}
            </p>
          </div>
        </div>

        {/* Action Toggle Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowConfigDetails(!showConfigDetails)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all ${
              showConfigDetails 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tuning Rules</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all"
          >
            <span>{isExpanded ? 'Hide Strategies' : 'Switch Strategy (7)'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Strategy Drawer (When user clicks "Switch Strategy") */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="text-xs font-mono font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Algorithmic Strategy Model for Even / Odd Execution:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(Object.values(EVEN_ODD_STRATEGIES) as StrategyMeta[]).map((strat) => {
              const isSelected = strat.id === config.strategyId;
              return (
                <button
                  key={strat.id}
                  onClick={() => handleSelectStrategy(strat.id)}
                  className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {getStrategyIcon(strat.id)}
                        <span className="text-xs font-bold font-mono">{strat.shortName}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isSelected 
                          ? 'bg-emerald-500/30 text-emerald-300' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {strat.accuracyGrade}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2 line-clamp-2">
                      {strat.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Min Trigger: {strat.recommendedMinStreak}x</span>
                    <span className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isSelected ? 'ACTIVE' : 'Select'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategy Tuning Drawer (Thresholds, Streaks, Strict Filtering) */}
      {showConfigDetails && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Fine-Tune Strategy Parameters for {activeStrategy.shortName}</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Asset: <strong className="text-slate-200">{currentSymbol.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {/* Streak Trigger */}
            <div className="space-y-1.5">
              <label className="text-slate-400 flex items-center justify-between">
                <span>Minimum Streak Trigger</span>
                <span className="text-emerald-400 font-bold">{config.minStreakTrigger}x</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[3, 4, 5].map((streak) => (
                  <button
                    key={streak}
                    onClick={() => onConfigChange({ ...config, minStreakTrigger: streak })}
                    className={`py-1.5 rounded-lg border text-center transition-all ${
                      config.minStreakTrigger === streak
                        ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    {streak}x {streak === 4 ? '(Rec)' : streak === 5 ? '(Sniper)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Confidence Filter */}
            <div className="space-y-1.5">
              <label className="text-slate-400 flex items-center justify-between">
                <span>Confidence Filter</span>
                <span className="text-cyan-400 font-bold">≥{config.minConfidenceThreshold}%</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[85, 90, 95, 98].map((thresh) => (
                  <button
                    key={thresh}
                    onClick={() => onConfigChange({ ...config, minConfidenceThreshold: thresh })}
                    className={`py-1.5 rounded-lg border text-center transition-all ${
                      config.minConfidenceThreshold === thresh
                        ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    {thresh}%
                  </button>
                ))}
              </div>
            </div>

            {/* Strict Anti-Chop Capital Filter */}
            <div className="space-y-1.5">
              <label className="text-slate-400 flex items-center justify-between">
                <span>Anti-Chop Capital Shield</span>
                <span className={config.strictFiltering ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {config.strictFiltering ? 'ENABLED' : 'DISABLED'}
                </span>
              </label>
              <button
                onClick={() => onConfigChange({ ...config, strictFiltering: !config.strictFiltering })}
                className={`w-full py-1.5 rounded-lg border text-center font-bold transition-all flex items-center justify-center gap-1.5 ${
                  config.strictFiltering
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{config.strictFiltering ? 'Filter Low-Edge Trades' : 'Allow Low-Edge Trades'}</span>
              </button>
            </div>
          </div>

          {/* Strategy Rules Bullet List */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 mb-1 font-semibold flex items-center gap-1">
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Strategy Execution Rules:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              {activeStrategy.rulesSummary.map((rule, idx) => (
                <li key={idx} className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Live Strategy Verification & Signal Execution Status Panel */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left 7 Columns: Current Live Signal & Filter Status */}
        <div className={`lg:col-span-7 rounded-xl p-4 border transition-all ${
          isSignalActive
            ? 'bg-gradient-to-r from-emerald-950/60 to-slate-950 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
            : 'bg-slate-950/80 border-amber-500/40 shadow-sm'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isSignalActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isSignalActive ? 'text-emerald-300' : 'text-amber-400'
              }`}>
                {isSignalActive ? '🎯 HIGH-ACCURACY SIGNAL QUALIFIED' : '🛡️ CAPITAL PRESERVATION ACTIVE — STAND ASIDE'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {currentSymbol.name}
            </span>
          </div>

          {isSignalActive ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[11px] text-slate-400 font-mono">Predicted Parity Entry:</div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white flex items-center gap-2">
                    <span className={analysis.targetParity === 'EVEN' ? 'text-cyan-400' : 'text-purple-400'}>
                      BUY {analysis.targetParity}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      {analysis.confidence}% Confidence
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onExecuteTrade(analysis.targetParity)}
                  className="px-5 py-2.5 rounded-xl font-bold font-mono text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Execute {analysis.targetParity}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Current Streak:</span>
                  <span className="text-white font-bold">{analysis.currentStreak}x {analysis.currentParity}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Expected Value:</span>
                  <span className="text-emerald-400 font-bold">+{analysis.expectedValuePercent}% EV</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Recovery Step:</span>
                  <span className="text-cyan-300 font-bold">{analysis.twoStepRecoveryWinRate}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-amber-200/90 font-mono bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300">Signal Filter Active:</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {analysis.filterReason || 'Current conditions do not satisfy strategy rules. Awaiting higher statistical conviction before risking stake.'}
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Streak: <strong className="text-slate-200">{analysis.currentStreak}x {analysis.currentParity}</strong> (Needs ≥{config.minStreakTrigger}x)</span>
                <span>Current Digit: <strong className="text-cyan-300">#{analysis.currentDigit}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Live Empirical Backtest on Loaded History */}
        <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulated Historical Backtest</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                Past 100 Ticks
              </span>
            </div>

            {backtest && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono my-2">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Realized Win Rate:</span>
                  <span className={`text-base font-black ${backtest.winRate >= 90 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {backtest.winRate}%
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Profit Factor:</span>
                  <span className="text-base font-black text-emerald-400">
                    {backtest.profitFactor}x
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Qualified Signals:</span>
                  <span className="text-sm font-bold text-slate-200">
                    {backtest.wins}W / {backtest.losses}L ({backtest.totalTradedSignals})
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Max Drawdown:</span>
                  <span className="text-sm font-bold text-amber-400">
                    {backtest.maxConsecutiveLosses} Loss Max
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] font-mono text-slate-500 leading-tight pt-2 border-t border-slate-800/80">
            {backtest?.historicalSimulationText || 'Strict filter eliminates random 50/50 chop to maximize accuracy.'}
          </p>
        </div>
      </div>
    </div>
  );
};
