import React from 'react';
import {
  Bot,
  Play,
  Square,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Compass,
  Lock,
  RefreshCw,
  Download,
  Link as LinkIcon,
  Wallet,
  ShieldCheck,
  FileCode2,
  Flame,
  Search,
  ArrowRightLeft
} from 'lucide-react';
import { DerivSymbol, DerivAccountInfo } from '../types';

export interface BotLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'strike' | 'win' | 'loss' | 'alert' | 'switch';
  message: string;
}

export interface BotConfig {
  mode: 'market_hunter' | 'single_market';
  entrySensitivity: 'optimal_only' | 'optimal_plus_secondary';
  baseStake: number;
  stakeStrategy: 'flat' | 'recovery';
  takeProfit: number;
  stopLoss: number;
  maxTrades: number;
  maxConsecutiveLosses: number;
  minWinRate: number;
  lossRecoveryMarketSwitch?: boolean;
}

export interface BotStats {
  tradesCount: number;
  wins: number;
  losses: number;
  netProfit: number;
  currentStreak: number;
  bestStreak: number;
}

interface Under8BotPanelProps {
  botActive: boolean;
  onToggleBot: () => void;
  botStatus: string;
  botStats: BotStats;
  botConfig: BotConfig;
  setBotConfig: React.Dispatch<React.SetStateAction<BotConfig>>;
  botLogs: BotLogEntry[];
  onClearLogs: () => void;
  onResetStats: () => void;
  symbol: DerivSymbol;
  bestEntryDigit: number;
  bestDigitWinRate: number;
  currentDigit: number;
  currentStake: number;
  topMarketName?: string;
  isContractPending: boolean;
  onRescanBestMarket?: () => void;
  isScanning?: boolean;
  accountInfo?: DerivAccountInfo;
  onOpenDownloadBotModal?: () => void;
  onOpenLinkAccountModal?: () => void;
  isLiveExecutionEnabled?: boolean;
  onToggleLiveExecution?: (enabled: boolean) => void;
  onManualStrike?: (stake: number) => void;
  isRecovering?: boolean;
  recoveryTargetSymbol?: DerivSymbol | null;
}

export const Under8BotPanel: React.FC<Under8BotPanelProps> = ({
  botActive,
  onToggleBot,
  botStatus,
  botStats,
  botConfig,
  setBotConfig,
  botLogs,
  onClearLogs,
  onResetStats,
  symbol,
  bestEntryDigit,
  bestDigitWinRate,
  currentDigit,
  currentStake,
  topMarketName,
  isContractPending,
  onRescanBestMarket,
  isScanning,
  accountInfo,
  onOpenDownloadBotModal,
  onOpenLinkAccountModal,
  isLiveExecutionEnabled = false,
  onToggleLiveExecution,
  onManualStrike,
  isRecovering = false,
  recoveryTargetSymbol
}) => {
  const winRate =
    botStats.tradesCount > 0
      ? ((botStats.wins / botStats.tradesCount) * 100).toFixed(1)
      : '0.0';

  const isProfitPositive = botStats.netProfit >= 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Bot Header & Master Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
              isRecovering
                ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-lg shadow-amber-500/20 animate-bounce'
                : botActive
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isRecovering ? <Flame className="w-6 h-6 text-amber-400 animate-pulse" /> : <Bot className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Under 8 Sniper Bot</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  1-TICK AUTO
                </span>
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 ${
                  botActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    botActive ? 'bg-slate-950 animate-ping' : 'bg-slate-500'
                  }`}
                />
                {botActive ? 'BOT RUNNING' : 'BOT STOPPED'}
              </span>

              {isRecovering && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1 font-bold">
                  <Flame className="w-3 h-3 text-amber-400" />
                  RECOVERY MODE ACTIVE (${currentStake.toFixed(2)})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated high-frequency execution triggered strictly on optimal Under 8 entry digit transitions with loss recovery market switching.
            </p>
          </div>
        </div>

        {/* Action Buttons: Download XML, Link Deriv, and Start/Stop */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDownloadBotModal && (
            <button
              id="under8-download-bot-xml-btn"
              onClick={onOpenDownloadBotModal}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/50 font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              title="Download official XML file to import into bot.deriv.com"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Bot (.xml)</span>
            </button>
          )}

          {onOpenLinkAccountModal && (
            <button
              id="under8-link-account-btn"
              onClick={onOpenLinkAccountModal}
              className={`px-3 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow border ${
                accountInfo?.isAuthorized
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
              title="Link or configure your Deriv account token"
            >
              <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {accountInfo?.isAuthorized
                  ? `Linked: ${accountInfo.loginid} (${accountInfo.isVirtual ? 'Demo' : 'Real'})`
                  : 'Link Deriv Account'}
              </span>
            </button>
          )}

          {/* Direct 1-Click Manual Strike Button */}
          {onManualStrike && (
            <button
              id="under8-bot-strike-now-btn"
              onClick={() => onManualStrike(botConfig.baseStake)}
              disabled={isContractPending}
              className={`px-3.5 py-2.5 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-1.5 border shadow-md ${
                isContractPending
                  ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-100 hover:text-white border-slate-700 hover:border-emerald-500/50 shadow-slate-950/50'
              }`}
              title={`Fire an immediate 1-tick Under 8 order with current base stake ($${botConfig.baseStake.toFixed(2)})`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">STRIKE NOW</span>
              <span className="sm:hidden">STRIKE</span>
              <span className="text-emerald-400">(${botConfig.baseStake.toFixed(2)})</span>
            </button>
          )}

          {/* Big Start / Stop Button */}
          <button
            id="under8-bot-toggle-btn"
            onClick={onToggleBot}
            className={`px-5 py-2.5 rounded-xl font-mono font-black text-sm transition-all flex items-center gap-2 shadow-xl ${
              botActive
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400/50'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400/50'
            }`}
          >
            {botActive ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>STOP BOT</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>START UNDER 8 BOT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Deriv Account Link & Execution Mode Bar */}
      <div className="p-3 rounded-xl bg-slate-850/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Account Mode:</span>
          </div>

          {accountInfo?.isAuthorized ? (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                {accountInfo.loginid} ({accountInfo.isVirtual ? 'DEMO' : 'REAL'})
              </span>
              <span className="text-slate-200 font-bold">
                ${accountInfo.balance?.toFixed(2)} {accountInfo.currency}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Paper Demo Simulation
              </span>
              <span className="text-slate-500 text-[11px]">(Zero Risk Test Mode)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {accountInfo?.isAuthorized && onToggleLiveExecution && (
            <button
              onClick={() => onToggleLiveExecution(!isLiveExecutionEnabled)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                isLiveExecutionEnabled
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle between real Deriv contract orders and local paper simulation"
            >
              {isLiveExecutionEnabled ? '⚡ LIVE DERIV ORDERS: ACTIVE' : 'SIMULATION MODE (CLICK TO GO LIVE)'}
            </button>
          )}

          {!accountInfo?.isAuthorized && onOpenLinkAccountModal && (
            <button
              onClick={onOpenLinkAccountModal}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-bold text-[11px]"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Link Account to Trade Live</span>
            </button>
          )}

          {onOpenDownloadBotModal && (
            <button
              onClick={onOpenDownloadBotModal}
              className="text-slate-400 hover:text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
            >
              <Download className="w-3 h-3" />
              <span>Export for bot.deriv.com</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Bot Telemetry & Status Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {/* Status */}
        <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Live Bot Status</div>
          <div className="text-xs font-mono font-bold mt-1 truncate flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isContractPending
                  ? 'bg-amber-400 animate-spin'
                  : botActive
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className={botActive ? 'text-emerald-300' : 'text-slate-400'}>
              {botStatus}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Target: Digit #{bestEntryDigit} ({bestDigitWinRate}%)
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Win Rate</div>
          <div className="text-base sm:text-lg font-mono font-black text-emerald-400 mt-0.5 flex items-center gap-1">
            <span>{winRate}%</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {botStats.wins}W / {botStats.losses}L ({botStats.tradesCount} trades)
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Session Net P/L</div>
          <div
            className={`text-base sm:text-lg font-mono font-black mt-0.5 flex items-center gap-1 ${
              isProfitPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>
              {isProfitPositive ? '+' : ''}${botStats.netProfit.toFixed(2)}
            </span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Target: +${botConfig.takeProfit} | Stop: -${botConfig.stopLoss}
          </div>
        </div>

        {/* Next Stake */}
        <div className={`p-3 rounded-xl border ${isRecovering ? 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-500/10' : 'bg-slate-850 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Next Stake</span>
            {isRecovering && (
              <span className="text-[9px] font-mono font-bold text-amber-300 px-1.5 py-0.2 rounded bg-amber-500/20">RECOVERING</span>
            )}
          </div>
          <div className={`text-base sm:text-lg font-mono font-black mt-0.5 ${isRecovering ? 'text-amber-300 animate-pulse' : 'text-white'}`}>
            ${currentStake.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {isRecovering ? '4.3x Recovery Active' : botConfig.stakeStrategy === 'recovery' ? 'Smart Recovery (Idle)' : 'Flat Stake'}
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Win Streak</div>
          <div className="text-base sm:text-lg font-mono font-black text-emerald-300 mt-0.5">
            {botStats.currentStreak} wins
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Best Run: {botStats.bestStreak}
          </div>
        </div>

        {/* Reset / Actions */}
        <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Bot Controls</div>
          <button
            onClick={onResetStats}
            className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold flex items-center justify-center gap-1 border border-slate-700 transition-colors"
            title="Reset Session Counters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Stats</span>
          </button>
        </div>
      </div>

      {/* Bot Configuration Tabs & Controls */}
      <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white font-mono uppercase">
              Bot Execution &amp; Risk Parameters
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setBotConfig((prev) => ({
                  ...prev,
                  baseStake: 1,
                  stakeStrategy: 'recovery',
                  takeProfit: 5,
                  stopLoss: 25,
                  entrySensitivity: 'optimal_only',
                  maxConsecutiveLosses: 3
                }));
              }}
              className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
              title="Instantly set recommended parameters: $1 Stake, Martingale Recovery, $5 TP, $25 SL"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Reset to Martingale Defaults ($1 Stake)</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              Active Asset: <strong className="text-emerald-400">{symbol.name}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Scanned Market Lock */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
              Scanned Market Lock
            </label>
            <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-white font-mono truncate">
                {symbol.name}
              </span>
              {onRescanBestMarket && (
                <button
                  type="button"
                  id="bot-rescan-best-btn"
                  onClick={onRescanBestMarket}
                  disabled={isScanning}
                  className="ml-auto px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-mono font-black flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                  title="Rescan all volatility markets and lock onto the highest-scoring asset"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning' : 'Rescan'}</span>
                </button>
              )}
            </div>
            <p className="text-[9px] text-slate-400 mt-1">
              🔒 Bot stays locked on <strong className="text-emerald-400">{symbol.name}</strong> until you rescan.
            </p>
          </div>

          {/* Trigger Sensitivity */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
              Trigger Sensitivity
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() =>
                  setBotConfig((prev) => ({
                    ...prev,
                    entrySensitivity: 'optimal_only'
                  }))
                }
                className={`py-1 text-xs font-mono font-bold rounded flex items-center justify-center gap-1 transition-colors ${
                  botConfig.entrySensitivity === 'optimal_only'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Strikes only on #1 Optimal Digit"
              >
                <span>Prime #{bestEntryDigit}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setBotConfig((prev) => ({
                    ...prev,
                    entrySensitivity: 'optimal_plus_secondary'
                  }))
                }
                className={`py-1 text-xs font-mono font-bold rounded flex items-center justify-center gap-1 transition-colors ${
                  botConfig.entrySensitivity === 'optimal_plus_secondary'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Strikes on Prime or Approved Secondary Digits"
              >
                <span>Prime + Sec</span>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">
              {botConfig.entrySensitivity === 'optimal_only'
                ? `Only fires on digit #${bestEntryDigit} (${bestDigitWinRate}%)`
                : 'Fires on prime digit and approved secondaries (≥86%)'}
            </p>
          </div>

          {/* Base Stake & Strategy */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">
                Base Stake ($)
              </label>
              <div className="flex gap-1 text-[10px] font-mono">
                {[0.5, 1, 2, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setBotConfig((prev) => ({ ...prev, baseStake: val }))
                    }
                    className={`px-1.5 py-0.2 rounded ${
                      botConfig.baseStake === val
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.5"
                max="1000"
                step="0.5"
                value={botConfig.baseStake}
                onChange={(e) =>
                  setBotConfig((prev) => ({
                    ...prev,
                    baseStake: Math.max(0.5, parseFloat(e.target.value) || 1)
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <select
                value={botConfig.stakeStrategy}
                onChange={(e) =>
                  setBotConfig((prev) => ({
                    ...prev,
                    stakeStrategy: e.target.value as 'flat' | 'recovery'
                  }))
                }
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="recovery">🔥 Martingale / Recovery</option>
                <option value="flat">🛡️ Flat Stake</option>
              </select>
            </div>
          </div>

          {/* Target Take Profit & Stop Loss */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">
                Take Profit / Stop Loss ($)
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] font-mono text-emerald-400">TP (+$)</span>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  value={botConfig.takeProfit}
                  onChange={(e) =>
                    setBotConfig((prev) => ({
                      ...prev,
                      takeProfit: Math.max(1, parseFloat(e.target.value) || 10)
                    }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <span className="text-[9px] font-mono text-rose-400">SL (-$)</span>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  value={botConfig.stopLoss}
                  onChange={(e) =>
                    setBotConfig((prev) => ({
                      ...prev,
                      stopLoss: Math.max(1, parseFloat(e.target.value) || 10)
                    }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Market Analysis & Loss Recovery Engine Settings */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                    <span>Loss Recovery Market Hunting</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      SMART ASSET SWITCH
                    </span>
                  </h4>
                  {isRecovering ? (
                    <span className="text-[10px] font-mono text-amber-300 animate-pulse font-bold">
                      ● Currently Recovering on {symbol.name} (${currentStake.toFixed(2)})
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-emerald-400">
                      ● Synchronized with 13+ Continuous Volatility Markets
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  When a contract loses (exit tick ≥ 8), the bot automatically scans all Deriv continuous volatility indices, selects the #1 market with the highest Under 8 edge and lowest breach frequency, switches assets, and enters a 1-tick recovery contract.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-850 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={botConfig.lossRecoveryMarketSwitch !== false}
                  onChange={(e) =>
                    setBotConfig((prev) => ({
                      ...prev,
                      lossRecoveryMarketSwitch: e.target.checked
                    }))
                  }
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Auto-Switch on Loss
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Live Bot Execution Log Terminal */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
        <div className="flex items-center justify-between pb-2 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-300 uppercase">
              Live Bot Terminal & Activity Stream
            </span>
            <span className="text-[10px] text-slate-500">
              ({botLogs.length} events logged)
            </span>
          </div>

          {botLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1 pr-1 text-xs select-text">
          {botLogs.length === 0 ? (
            <div className="text-slate-500 text-xs py-3 text-center">
              Bot terminal idle. Click &quot;START UNDER 8 BOT&quot; to begin autonomous execution.
            </div>
          ) : (
            botLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 py-1 px-2 rounded hover:bg-slate-900/60 transition-colors"
              >
                <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                  [{log.timestamp}]
                </span>
                <span className="shrink-0 mt-0.5">
                  {log.type === 'win' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : log.type === 'loss' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  ) : log.type === 'strike' ? (
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  ) : log.type === 'switch' ? (
                    <Compass className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </span>
                <span
                  className={`text-xs ${
                    log.type === 'win'
                      ? 'text-emerald-300 font-bold'
                      : log.type === 'loss'
                      ? 'text-rose-300 font-bold'
                      : log.type === 'strike'
                      ? 'text-amber-300 font-semibold'
                      : log.type === 'switch'
                      ? 'text-teal-300'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
