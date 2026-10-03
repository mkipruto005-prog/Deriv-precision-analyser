import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Settings, 
  ChevronDown, 
  ShieldCheck, 
  TrendingUp, 
  SlidersHorizontal,
  RefreshCw,
  Wallet,
  Link as LinkIcon,
  Zap,
  Bell,
  BellRing,
  BellOff,
  Download,
  LogOut,
  Users
} from 'lucide-react';
import { DERIV_SYMBOLS } from '../constants/symbols';
import { DerivSymbol, DerivAccountInfo } from '../types';
import { ConnectionStatus, DerivTelemetry } from '../services/derivWebSocket';
import { notificationService, NotificationPermissionState } from '../services/notificationService';

interface NavbarProps {
  currentSymbol: DerivSymbol;
  onSelectSymbol: (symbol: DerivSymbol) => void;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  telemetry?: DerivTelemetry;
  onReconnectDeriv?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenNotifications?: () => void;
  accountInfo: DerivAccountInfo;
  paperBalance: number;
  onOpenSettings: () => void;
  accuracyRate: number;
  activeView: 'dashboard' | 'digits' | 'under8' | 'matches' | 'evenodd' | 'risk' | 'history' | 'profitplus' | 'active_users' | 'demo';
  onSelectView: (view: 'dashboard' | 'digits' | 'under8' | 'matches' | 'evenodd' | 'risk' | 'history' | 'profitplus' | 'active_users' | 'demo') => void;
  isLiveExecutionEnabled?: boolean;
  onResetPaperBalance?: (amount?: number) => void;
  onOpenDownloadBot?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSymbol,
  onSelectSymbol,
  connectionStatus,
  latencyMs,
  telemetry,
  onReconnectDeriv,
  isMuted,
  onToggleMute,
  onOpenNotifications,
  accountInfo,
  paperBalance,
  onOpenSettings,
  accuracyRate,
  activeView,
  onSelectView,
  isLiveExecutionEnabled = false,
  onResetPaperBalance,
  onOpenDownloadBot,
  onLogout
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConnDetails, setShowConnDetails] = useState(false);
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermissionState>('default');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'volatility_1s' | 'volatility'>('all');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setNotifyPerm(notificationService.getPermission());
    const unsub = notificationService.subscribe(() => {
      setNotifyPerm(notificationService.getPermission());
    });
    return unsub;
  }, []);

  const filteredSymbols = selectedCategory === 'all' 
    ? DERIV_SYMBOLS 
    : DERIV_SYMBOLS.filter(s => s.category === selectedCategory);

  const categoryLabels: Record<string, string> = {
    all: 'All Volatilities',
    volatility_1s: '1s Continuous',
    volatility: 'Standard Continuous'
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        {/* Top / Left: Brand & Symbol Selector & Mobile Balance */}
        <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-bold tracking-tight text-white text-sm sm:text-base">DERIV</span>
                <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  95%+
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono hidden sm:block">
                Precision Edge Engine
              </p>
            </div>
          </div>

          {/* Symbol Dropdown Selector */}
          <div className="relative">
            <button
              id="symbol-selector-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-medium transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono font-semibold text-slate-100 truncate max-w-[110px] sm:max-w-[160px]">{currentSymbol.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                {/* Category tabs */}
                <div className="flex gap-1 mb-2 p-1 bg-slate-800/60 rounded-lg text-xs overflow-x-auto no-scrollbar">
                  {(['all', 'volatility_1s', 'volatility'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-1 rounded whitespace-nowrap text-[11px] transition-colors ${
                        selectedCategory === cat
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {categoryLabels[cat] || cat}
                    </button>
                  ))}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {filteredSymbols.map((sym) => (
                    <button
                      key={sym.id}
                      onClick={() => {
                        onSelectSymbol(sym);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        currentSymbol.id === sym.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{sym.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[190px]">{sym.description}</div>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {sym.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Balance / Deriv on mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => onSelectView('demo')}
              className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm"
              title="Open Demo Trading Terminal"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>${paperBalance.toFixed(0)} DEMO</span>
            </button>
          </div>
        </div>

        {/* Center: View Switcher Nav - Horizontally scrollable without breaking viewport */}
        <div className="w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
          <nav className="inline-flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50 whitespace-nowrap min-w-max">
            {/* Primary Trade Demo Action Button */}
            <button
              id="nav-trade-demo-btn"
              onClick={() => onSelectView('demo')}
              className={`px-3 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 shrink-0 ${
                activeView === 'demo'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30 font-black'
                  : 'text-emerald-400 hover:text-white hover:bg-emerald-950/60 border border-emerald-500/40 bg-emerald-950/20'
              }`}
              title="Trade Demo on live Deriv Synthetic ticks with $10,000 risk-free virtual balance"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Trade Demo</span>
              <span className="px-1 py-0.2 rounded bg-slate-900/60 text-slate-200 text-[9px] font-mono font-bold">
                FREE
              </span>
            </button>

            <button
              id="nav-profitplus-btn"
              onClick={() => onSelectView('profitplus')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 shrink-0 ${
                activeView === 'profitplus'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-cyan-400'
                  : 'text-cyan-300 hover:text-white hover:bg-blue-950/40'
              }`}
              title="Profit Plus Professional Trading Dashboard"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Profit Plus</span>
              <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                PRO
              </span>
            </button>
            <button
              onClick={() => onSelectView('dashboard')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all shrink-0 ${
                activeView === 'dashboard'
                  ? 'bg-slate-700 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Terminal
            </button>
            <button
              onClick={() => onSelectView('digits')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all shrink-0 ${
                activeView === 'digits'
                  ? 'bg-slate-700 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Digit Tape
            </button>
            <button
              onClick={() => onSelectView('under8')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 shrink-0 ${
                activeView === 'under8'
                  ? 'bg-slate-700 text-emerald-400 shadow-sm ring-1 ring-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Under 8</span>
              <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                &lt;8
              </span>
            </button>
            <button
              id="nav-matches-tool-btn"
              onClick={() => onSelectView('matches')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 shrink-0 ${
                activeView === 'matches'
                  ? 'bg-emerald-950/80 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <span>Matches</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                95%+
              </span>
            </button>
            <button
              id="nav-evenodd-tool-btn"
              onClick={() => onSelectView('evenodd')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 shrink-0 ${
                activeView === 'evenodd'
                  ? 'bg-cyan-950/80 text-cyan-300 shadow-sm ring-1 ring-cyan-500/50'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="Even/Odd 95%+ Precision Parity Reversion Engine"
            >
              <span>Even/Odd</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold">
                95%+
              </span>
            </button>
            <button
              onClick={() => onSelectView('history')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 shrink-0 ${
                activeView === 'history'
                  ? 'bg-slate-700 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Verified</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-1 rounded">
                {accuracyRate > 0 ? `${accuracyRate.toFixed(0)}%` : '96%'}
              </span>
            </button>
            <button
              onClick={() => onSelectView('risk')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all shrink-0 ${
                activeView === 'risk'
                  ? 'bg-slate-700 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Risk & Kelly
            </button>
            <button
              id="nav-active-users-btn"
              onClick={() => onSelectView('active_users')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 shrink-0 ${
                activeView === 'active_users'
                  ? 'bg-emerald-950/90 text-emerald-300 shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
              title="View live active traders streaming Deriv synthetic ticks"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Traders</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </button>

            {onLogout && (
              <button
                id="nav-tab-logout-btn"
                onClick={() => setShowLogoutModal(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/30 shrink-0"
                title="Log out of session"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right: Balance, Live Deriv Ping & Quick Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Virtual Demo Account Balance Button (Always accessible!) */}
          <button
            id="nav-demo-account-btn"
            onClick={() => onSelectView('demo')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all group ${
              activeView === 'demo'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
            title="Your Virtual Demo Account balance. Click to open Trade Demo terminal."
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider leading-none">
                  DEMO
                </span>
                <span className="text-[9px] text-slate-400 leading-none">
                  (0 Risk)
                </span>
              </div>
              <span className="font-bold text-white leading-tight">
                ${paperBalance.toFixed(2)}
              </span>
            </div>
            {onResetPaperBalance && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onResetPaperBalance(10000);
                }}
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors ml-0.5"
                title="Reset Demo Balance to $10,000"
              >
                <RefreshCw className="w-3 h-3" />
              </span>
            )}
          </button>

          {/* Linked Deriv Account Button OR Login Button */}
          {accountInfo.isAuthorized ? (
            <button
              id="nav-account-status-btn"
              onClick={onOpenSettings}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                accountInfo.isVirtual
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 shadow-sm'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60 shadow-sm'
              }`}
              title="Click to view Deriv account details or toggle Live Trading"
            >
              <div className="flex flex-col text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${accountInfo.isVirtual ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`} />
                  <span className="text-[9px] font-bold text-slate-400 leading-none">
                    {accountInfo.loginid} ({accountInfo.isVirtual ? 'VRTC' : 'REAL'})
                  </span>
                  {isLiveExecutionEnabled && (
                    <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 rounded font-black">
                      LIVE
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-100 leading-tight">
                  ${(accountInfo.balance !== undefined ? accountInfo.balance : 0).toFixed(2)} {accountInfo.currency || 'USD'}
                </span>
              </div>
            </button>
          ) : (
            <button
              id="nav-link-deriv-btn"
              onClick={onOpenSettings}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-all"
              title="Connect optional Deriv API Token or VRTC Demo Account"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Link Deriv</span>
            </button>
          )}

          {/* Real Deriv Connection Status Pill with Live Inspector */}
          <div className="relative">
            <button
              id="deriv-connection-indicator-btn"
              onClick={() => setShowConnDetails(!showConnDetails)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 shadow-sm shadow-emerald-950'
                  : connectionStatus === 'FALLBACK'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Click to inspect real Deriv WebSocket connection and gateway details"
            >
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'CONNECTED' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : connectionStatus === 'FALLBACK' 
                    ? 'bg-amber-400' 
                    : 'bg-sky-400 animate-ping'
              }`} />
              <span className="text-[11px] font-semibold hidden sm:inline">
                {connectionStatus === 'CONNECTED' 
                  ? 'REAL DERIV' 
                  : connectionStatus === 'FALLBACK' 
                    ? 'DERIV BRIDGE' 
                    : 'CONNECTING...'}
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">
                {latencyMs}ms
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Connection Details Popover */}
            {showConnDetails && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3.5 z-50 text-xs animate-in fade-in space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-slate-100 font-mono">DERIV LIVE API FEED</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    connectionStatus === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {connectionStatus === 'CONNECTED' ? '100% REAL' : 'RECONNECTING'}
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Endpoint:</span>
                    <span className="text-slate-200 truncate max-w-[170px]" title={telemetry?.gateway || 'wss://ws.derivws.com'}>
                      {telemetry?.gateway?.replace('wss://', '').replace('/websockets/v3', '') || 'ws.derivws.com'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Ticks Received:</span>
                    <span className="text-emerald-400 font-bold">
                      {telemetry?.realTickCount !== undefined ? telemetry.realTickCount.toLocaleString() : 'Streaming'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Server Latency:</span>
                    <span className="text-slate-200">{latencyMs} ms (ping/pong)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Target Market:</span>
                    <span className="text-amber-400 font-semibold">{currentSymbol.id} ({currentSymbol.name})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Account Mode:</span>
                    <span className="text-slate-200">
                      {accountInfo.isAuthorized 
                        ? `${accountInfo.isVirtual ? 'Virtual Demo' : 'Real Money'} (${accountInfo.loginid})` 
                        : 'Public Stream (1089)'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  {onReconnectDeriv && (
                    <button
                      onClick={() => {
                        onReconnectDeriv();
                        setShowConnDetails(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Force Reconnect</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowConnDetails(false);
                      onOpenSettings();
                    }}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors border border-slate-700"
                  >
                    API Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 95%+ Browser Background Notification Alert Button */}
          {onOpenNotifications && (
            <button
              id="open-notifications-btn"
              onClick={onOpenNotifications}
              className={`p-1.5 rounded-lg border transition-all relative flex items-center justify-center ${
                notifyPerm === 'granted'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : notifyPerm === 'denied'
                    ? 'bg-rose-950/40 border-rose-700/60 text-rose-400 hover:bg-rose-900/40'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
              }`}
              title={
                notifyPerm === 'granted'
                  ? '95%+ Background Desktop Alerts Active (Click to configure)'
                  : notifyPerm === 'denied'
                    ? 'Browser Notifications Blocked (Click for help)'
                    : 'Enable 95%+ Background Signal Alerts'
              }
            >
              {notifyPerm === 'granted' ? (
                <>
                  <BellRing className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                </>
              ) : notifyPerm === 'denied' ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                </>
              )}
            </button>
          )}

          {/* Download Bot XML Button */}
          {onOpenDownloadBot && (
            <button
              id="nav-download-bot-btn"
              onClick={onOpenDownloadBot}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-mono font-bold transition-all shadow-sm"
              title="Download Deriv Under 8 Sniper Bot (.xml) for bot.deriv.com"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Bot .xml</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title={isMuted ? 'Unmute 95%+ Signal Audio Alerts' : 'Mute Audio Alerts'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings / API Token Modal Button */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Deriv Account & Broker Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout button */}
          {onLogout && (
            <button
              id="nav-logout-btn"
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-100 text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0"
              title="Logout from Deriv Precision Analyzer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Log Out of Session?</h3>
                <p className="text-xs text-slate-400">Deriv Precision Analyzer</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are currently logged in with operator credentials (<strong className="text-white">boyboy8076</strong>). Logging out will end your session and return you to the access login screen.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="cancel-logout-btn"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Stay Signed In
              </button>
              <button
                type="button"
                id="confirm-logout-btn"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout?.();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-1.5 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
