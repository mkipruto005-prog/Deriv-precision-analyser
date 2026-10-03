import React, { useState } from 'react';
import { 
  Bot, 
  Play, 
  Square, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  TrendingUp, 
  AlertTriangle,
  SlidersHorizontal,
  Clock,
  Zap,
  Target,
  Download
} from 'lucide-react';
import { DerivSymbol } from '../types';

export interface DashboardBotConfig {
  isActive: boolean;
  strategy: 'under8' | 'differs' | 'matches' | 'confluence' | 'evenodd' | 'smart_auto';
  baseStake: number;
  multiplier: number; // 1.0 for flat, 1.25 for soft recovery, 2.0 for mart
  takeProfit: number;
  stopLoss: number;
  minWinRate: number;
}

export interface DashboardBotStats {
  tradesCount: number;
  wins: number;
  losses: number;
  netProfit: number;
  currentStreak: number;
  statusMessage: string;
}

export interface DashboardSniperBotProps {
  config: DashboardBotConfig;
  stats: DashboardBotStats;
  currentSymbol?: DerivSymbol;
  currentDigit?: number;
  under8Status?: string;
  coldestDigit?: number;
  onUpdateConfig?: (updater: (prev: DashboardBotConfig) => DashboardBotConfig) => void;
  onResetStats?: () => void;
  onChangeConfig?: (updater: (prev: DashboardBotConfig) => DashboardBotConfig) => void;
  onResetBotStats?: () => void;
  onOpenDownloadBot?: () => void;
}

export const DashboardSniperBot: React.FC<DashboardSniperBotProps> = ({
  config,
  stats,
  currentSymbol,
  currentDigit,
  under8Status,
  coldestDigit,
  onUpdateConfig,
  onResetStats,
  onChangeConfig,
  onResetBotStats,
  onOpenDownloadBot
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleUpdate = onUpdateConfig || onChangeConfig || (() => {});
  const handleReset = onResetStats || onResetBotStats || (() => {});

  const toggleBot = () => {
    handleUpdate(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const winRate = stats.tradesCount > 0 ? (stats.wins / stats.tradesCount) * 100 : 100;

  return (
    <div id="dashboard-sniper-bot" className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xl relative overflow-hidden ${
      config.isActive 
        ? 'bg-slate-900/95 border-emerald-500/70 ring-1 ring-emerald-500/30' 
        : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Ambient background glow when active */}
      {config.isActive && (
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            config.isActive
              ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white uppercase tracking-wider">
                Autonomous 95%+ Sniper Bot
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                config.isActive
                  ? 'bg-emerald-500 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {config.isActive ? 'AUTOPILOT ARMED' : 'STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Scans tick flow and executes 1-tick high-probability setups automatically
            </p>
          </div>
        </div>

        {/* Start / Stop Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors flex items-center gap-1.5"
            title="Configure Bot Parameters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            id="toggle-sniper-bot-btn"
            onClick={toggleBot}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
              config.isActive
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {config.isActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP SNIPER</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START AUTOPILOT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bot Performance Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Strategy</span>
          <span className="font-mono font-bold text-xs text-emerald-300 capitalize">
            {config.strategy === 'smart_auto' ? '⚡ Auto-Strike (>95%)' : config.strategy === 'under8' ? 'Under 8 Safe' : config.strategy === 'differs' ? 'Differs Cold' : config.strategy === 'matches' ? 'Matches 809% (+EV)' : config.strategy === 'evenodd' ? 'Even/Odd' : 'Confluence'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Win Rate</span>
          <span className="font-mono font-bold text-xs text-emerald-400 flex items-center gap-1">
            <span>{winRate.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400">({stats.wins}W / {stats.losses}L)</span>
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Session P&amp;L</span>
          <span className={`font-mono font-bold text-xs ${
            stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {stats.netProfit >= 0 ? `+$${stats.netProfit.toFixed(2)}` : `-$${Math.abs(stats.netProfit).toFixed(2)}`}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Win Streak</span>
          <span className="font-mono font-bold text-xs text-amber-400">
            {stats.currentStreak} in a row
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Base Stake</span>
            <span className="font-mono font-bold text-xs text-slate-200">
              ${config.baseStake}
            </span>
          </div>
          <button
            onClick={onResetBotStats}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="Reset Bot Session Stats"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Status Ticker */}
      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            config.isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
          }`} />
          <span className="text-slate-300">
            {stats.statusMessage || (config.isActive ? 'Scanning real-time ticks for certified edge...' : 'Autopilot paused. Click Start to trade automatically.')}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:inline">
          {currentSymbol?.name || 'Volatility Index'}
        </span>
      </div>

      {/* Expandable Settings Drawer */}
      {showSettings && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              Bot Execution &amp; Risk Parameters
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Strategy */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Strategy Algorithm
              </label>
              <select
                value={config.strategy}
                onChange={(e) => onChangeConfig(prev => ({ ...prev, strategy: e.target.value as any }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="smart_auto">⚡ Smart Auto-Strike (Any Certified &gt;95% Entry)</option>
                <option value="under8">Under 8 Safe Haven (&lt;8)</option>
                <option value="evenodd">Even/Odd 95%+ Parity Reversion</option>
                <option value="matches">Digit Matches 809% Sniper (+EV &amp; 8-Loss Buffer)</option>
                <option value="differs">Differs Cold Digit Strike (96%+)</option>
                <option value="confluence">8-Factor Confluence (Any &gt;95%)</option>
              </select>
            </div>

            {/* Base Stake */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Base Stake ($)
              </label>
              <input
                type="number"
                min="0.35"
                step="1"
                value={config.baseStake}
                onChange={(e) => onChangeConfig(prev => ({ ...prev, baseStake: Math.max(0.35, parseFloat(e.target.value) || 1) }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Take Profit */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Take Profit Target ($)
              </label>
              <input
                type="number"
                min="5"
                value={config.takeProfit}
                onChange={(e) => onChangeConfig(prev => ({ ...prev, takeProfit: Math.max(5, parseFloat(e.target.value) || 25) }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Max Stop Loss ($)
              </label>
              <input
                type="number"
                min="10"
                value={config.stopLoss}
                onChange={(e) => onChangeConfig(prev => ({ ...prev, stopLoss: Math.max(10, parseFloat(e.target.value) || 50) }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
