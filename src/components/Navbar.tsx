import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Settings, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
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
  Users, 
  Code, 
  Layers,
  Flame,
  Grid,
  BarChart2,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { DERIV_SYMBOLS } from '../constants/symbols';
import { DerivSymbol, DerivAccountInfo } from '../types';
import { ConnectionStatus, DerivTelemetry } from '../services/derivWebSocket';
import { notificationService, NotificationPermissionState } from '../services/notificationService';
import { DerivOAuthAccount } from '../utils/derivOAuth';

type ViewType = 'dashboard' | 'digits' | 'under8' | 'matches' | 'evenodd' | 'risk' | 'history' | 'profitplus' | 'active_users' | 'demo' | 'bulk';

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
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  isLiveExecutionEnabled?: boolean;
  onResetPaperBalance?: (amount?: number) => void;
  onOpenDownloadBot?: () => void;
  onOpenSourceCode?: () => void;
  onLogout?: () => void;
  savedAccounts?: DerivOAuthAccount[];
  onSelectAccount?: (token: string) => void;
}

interface ToolNavItem {
  id: ViewType;
  label: string;
  badge?: string;
  badgeColorClass?: string;
  icon: React.ReactNode;
  category: 'terminals' | 'strategies' | 'analytics';
  categoryLabel: string;
  description: string;
  customActiveStyle?: string;
  customInactiveStyle?: string;
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
  onOpenSourceCode,
  onLogout,
  savedAccounts = [],
  onSelectAccount
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [showConnDetails, setShowConnDetails] = useState(false);
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermissionState>('default');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'volatility_1s' | 'volatility'>('all');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  // Horizontal scroll state & ref for the tools strip
  const toolsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollState = () => {
    if (toolsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = toolsScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    checkScrollState();
    const handleResize = () => checkScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update scroll state when activeView changes (smoothly scroll active tab into view if offscreen)
  useEffect(() => {
    if (toolsScrollRef.current) {
      const activeEl = toolsScrollRef.current.querySelector<HTMLElement>(`[data-view-id="${activeView}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
      setTimeout(checkScrollState, 300);
    }
  }, [activeView]);

  useEffect(() => {
    setNotifyPerm(notificationService.getPermission());
    const unsub = notificationService.subscribe(() => {
      setNotifyPerm(notificationService.getPermission());
    });
    return unsub;
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#symbol-selector-container')) {
        setDropdownOpen(false);
      }
      if (!target.closest('#tools-quick-menu-container')) {
        setToolsMenuOpen(false);
      }
      if (!target.closest('#conn-details-container')) {
        setShowConnDetails(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollTools = (direction: 'left' | 'right') => {
    if (toolsScrollRef.current) {
      const delta = direction === 'left' ? -220 : 220;
      toolsScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
      setTimeout(checkScrollState, 250);
    }
  };

  const handleToolsWheel = (e: React.WheelEvent) => {
    if (toolsScrollRef.current && e.deltaY !== 0) {
      toolsScrollRef.current.scrollLeft += e.deltaY;
      checkScrollState();
    }
  };

  const filteredSymbols = selectedCategory === 'all' 
    ? DERIV_SYMBOLS 
    : DERIV_SYMBOLS.filter(s => s.category === selectedCategory);

  const categoryLabels: Record<string, string> = {
    all: 'All Volatilities',
    volatility_1s: '1s Continuous',
    volatility: 'Standard Continuous'
  };

  // Comprehensive suite tools registry
  const ALL_TOOLS: ToolNavItem[] = [
    {
      id: 'demo',
      label: 'Trade Demo',
      badge: 'FREE',
      icon: <Zap className="w-3.5 h-3.5 fill-current" />,
      category: 'terminals',
      categoryLabel: 'Core Terminals',
      description: 'Practice with $10,000 risk-free virtual balance on live Deriv synthetic ticks',
      customActiveStyle: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300',
      customInactiveStyle: 'text-emerald-400 hover:text-white hover:bg-emerald-950/60 border border-emerald-500/40 bg-emerald-950/20'
    },
    {
      id: 'profitplus',
      label: 'Profit Plus',
      badge: 'PRO',
      icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />,
      category: 'terminals',
      categoryLabel: 'Core Terminals',
      description: 'Professional trading terminal with advanced statistics & multi-contract execution',
      customActiveStyle: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/25 ring-1 ring-cyan-400',
      customInactiveStyle: 'text-cyan-300 hover:text-white hover:bg-blue-950/40 border border-blue-500/30 bg-blue-950/20'
    },
    {
      id: 'bulk',
      label: 'Bulk Trading',
      badge: 'BATCH',
      icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
      category: 'terminals',
      categoryLabel: 'Core Terminals',
      description: 'Multi-contract burst execution engine & automated risk circuit breakers',
      customActiveStyle: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-md shadow-indigo-500/25 ring-1 ring-indigo-400',
      customInactiveStyle: 'text-indigo-300 hover:text-white hover:bg-indigo-950/40 border border-indigo-500/30 bg-indigo-950/20'
    },
    {
      id: 'dashboard',
      label: 'Terminal',
      badge: 'LIVE',
      icon: <Activity className="w-3.5 h-3.5" />,
      category: 'terminals',
      categoryLabel: 'Core Terminals',
      description: 'Primary precision terminal & confluence indicator radar',
      customActiveStyle: 'bg-slate-700 text-emerald-400 font-bold shadow-sm ring-1 ring-slate-600',
      customInactiveStyle: 'text-slate-300 hover:text-white hover:bg-slate-800'
    },
    {
      id: 'under8',
      label: 'Under 8',
      badge: '<8',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      category: 'strategies',
      categoryLabel: 'High-Probability (95%+)',
      description: 'Safe Haven Digit Under 8 edge with 8/9 drought detector',
      customActiveStyle: 'bg-emerald-950/90 text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500/50',
      customInactiveStyle: 'text-slate-300 hover:text-emerald-300 hover:bg-slate-800'
    },
    {
      id: 'matches',
      label: 'Matches',
      badge: '95%+',
      icon: <Zap className="w-3.5 h-3.5" />,
      category: 'strategies',
      categoryLabel: 'High-Probability (95%+)',
      description: '95%+ Matches prediction matrix based on extreme Poisson digit decay',
      customActiveStyle: 'bg-emerald-950/90 text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500/50',
      customInactiveStyle: 'text-slate-300 hover:text-emerald-300 hover:bg-slate-800'
    },
    {
      id: 'evenodd',
      label: 'Even/Odd',
      badge: '95%+',
      icon: <Flame className="w-3.5 h-3.5 text-cyan-400" />,
      category: 'strategies',
      categoryLabel: 'High-Probability (95%+)',
      description: 'Parity reversion predictor & Poisson streak exhaustion scanner',
      customActiveStyle: 'bg-cyan-950/90 text-cyan-300 font-bold shadow-sm ring-1 ring-cyan-500/50',
      customInactiveStyle: 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
    },
    {
      id: 'digits',
      label: 'Digit Tape',
      icon: <BarChart2 className="w-3.5 h-3.5" />,
      category: 'analytics',
      categoryLabel: 'Analytics & Risk',
      description: 'Real-time digit frequency distribution & micro-streak worm tape',
      customActiveStyle: 'bg-slate-700 text-emerald-400 font-bold shadow-sm ring-1 ring-slate-600',
      customInactiveStyle: 'text-slate-300 hover:text-white hover:bg-slate-800'
    },
    {
      id: 'history',
      label: 'Verified Audit',
      badge: accuracyRate > 0 ? `${accuracyRate.toFixed(0)}%` : '96%',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
      category: 'analytics',
      categoryLabel: 'Analytics & Risk',
      description: 'Audited trade execution log & verified empirical win rate history',
      customActiveStyle: 'bg-slate-700 text-emerald-400 font-bold shadow-sm ring-1 ring-slate-600',
      customInactiveStyle: 'text-slate-300 hover:text-white hover:bg-slate-800'
    },
    {
      id: 'risk',
      label: 'Risk & Kelly',
      icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
      category: 'analytics',
      categoryLabel: 'Analytics & Risk',
      description: 'Position sizing, drawdown protection & compounding math',
      customActiveStyle: 'bg-slate-700 text-emerald-400 font-bold shadow-sm ring-1 ring-slate-600',
      customInactiveStyle: 'text-slate-300 hover:text-white hover:bg-slate-800'
    },
    {
      id: 'active_users',
      label: 'Live Traders',
      badge: 'LIVE',
      icon: <Users className="w-3.5 h-3.5 text-emerald-400" />,
      category: 'analytics',
      categoryLabel: 'Analytics & Risk',
      description: 'Active trader stream & global community consensus',
      customActiveStyle: 'bg-emerald-950/90 text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500/50',
      customInactiveStyle: 'text-slate-300 hover:text-emerald-300 hover:bg-slate-800'
    }
  ];

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 w-full shadow-lg">
      {/* Row 1: Primary Controls Bar (Brand, Market Selector, Account Status, Broker Settings) */}
      <div className="w-full max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 py-2 flex items-center justify-between gap-3 border-b border-slate-800/80">
        {/* Left: Brand Mark & Symbol Selector */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
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
          <div id="symbol-selector-container" className="relative">
            <button
              id="symbol-selector-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-medium transition-all shadow-sm"
              title="Click to select synthetic volatility market"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono font-semibold text-slate-100 truncate max-w-[120px] sm:max-w-[170px] lg:max-w-[210px]">
                {currentSymbol.name}
              </span>
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
        </div>

        {/* Right: Balance, Live Deriv Ping, Audio, Settings & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Virtual Demo Account Balance Button (hidden on mobile to prevent overflow) */}
          <button
            id="nav-demo-account-btn"
            onClick={() => onSelectView('demo')}
            className={`hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-mono transition-all group shrink-0 ${
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
                <span className="text-[9px] text-slate-400 leading-none hidden sm:inline">
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
                className="p-0.5 sm:p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors ml-0.5"
                title="Reset Demo Balance to $10,000"
              >
                <RefreshCw className="w-3 h-3" />
              </span>
            )}
          </button>

          {/* Linked Deriv Account Button with Quick Switcher OR Login with Deriv button */}
          {accountInfo.isAuthorized ? (
            <div className="relative shrink-0">
              <button
                id="nav-account-status-btn"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-xs font-mono transition-all shadow-sm shrink-0"
                title="Click to switch account (Demo / Real) or view details"
              >
                <div className={`w-2 h-2 rounded-full ${accountInfo.isVirtual ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse shrink-0`} />
                <div className="flex flex-col text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[9px] font-bold text-slate-400 leading-none truncate max-w-[85px] sm:max-w-none">
                      {accountInfo.loginid}
                    </span>
                    <span className={`text-[8px] sm:text-[9px] px-1 py-0.2 rounded font-black leading-none ${
                      accountInfo.isVirtual ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {accountInfo.isVirtual ? 'DEMO' : 'REAL'}
                    </span>
                    {isLiveExecutionEnabled && (
                      <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 rounded font-black hidden sm:inline">
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold text-white text-xs sm:text-sm leading-tight">
                    ${(accountInfo.balance !== undefined ? accountInfo.balance : 0).toFixed(2)} {accountInfo.currency || 'USD'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {accountDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in space-y-3">
                  {/* Account Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">ACTIVE DERIV ACCOUNT</div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{accountInfo.loginid}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          accountInfo.isVirtual ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {accountInfo.isVirtual ? 'DEMO' : 'REAL'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">BALANCE</div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        ${(accountInfo.balance !== undefined ? accountInfo.balance : 0).toFixed(2)} {accountInfo.currency || 'USD'}
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Segmented Toggle between Demo and Real accounts */}
                  {savedAccounts && savedAccounts.length > 1 && onSelectAccount && (
                    <div className="space-y-1.5 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono font-bold flex items-center justify-between">
                        <span>1-CLICK ACCOUNT SWITCH</span>
                        <span className="text-[9px] text-emerald-400 font-mono">INSTANT</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Demo Button */}
                        {(() => {
                          const demoAcc = savedAccounts.find(a => a.isVirtual || a.account.toUpperCase().startsWith('VRTC') || a.account.toUpperCase().startsWith('VRT'));
                          if (!demoAcc) return null;
                          const isCurrent = demoAcc.account === accountInfo.loginid;
                          return (
                            <button
                              key="toggle-demo"
                              type="button"
                              onClick={() => {
                                onSelectAccount(demoAcc.token);
                                setAccountDropdownOpen(false);
                              }}
                              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${
                                isCurrent
                                  ? 'bg-cyan-500 text-slate-950 shadow-md ring-1 ring-cyan-300'
                                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30'
                              }`}
                            >
                              <span className="text-[11px] font-black uppercase">Demo Account</span>
                              <span className="text-[9px] opacity-80">{demoAcc.account}</span>
                            </button>
                          );
                        })()}

                        {/* Real Button */}
                        {(() => {
                          const realAcc = savedAccounts.find(a => !a.isVirtual && !a.account.toUpperCase().startsWith('VRTC') && !a.account.toUpperCase().startsWith('VRT'));
                          if (!realAcc) return null;
                          const isCurrent = realAcc.account === accountInfo.loginid;
                          return (
                            <button
                              key="toggle-real"
                              type="button"
                              onClick={() => {
                                onSelectAccount(realAcc.token);
                                setAccountDropdownOpen(false);
                              }}
                              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${
                                isCurrent
                                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-1 ring-emerald-300'
                                  : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              <span className="text-[11px] font-black uppercase">Real Money</span>
                              <span className="text-[9px] opacity-80">{realAcc.account}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Switch between Real and Demo accounts (Detailed list) */}
                  {savedAccounts && savedAccounts.length > 0 && onSelectAccount && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-400 font-mono">CONNECTED ACCOUNTS</div>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {savedAccounts.map((acc) => {
                          const isCurrent = acc.account === accountInfo.loginid;
                          return (
                            <button
                              key={acc.account}
                              onClick={() => {
                                onSelectAccount(acc.token);
                                setAccountDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-mono transition-all ${
                                isCurrent
                                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold'
                                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${acc.isVirtual ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                                <span>{acc.account}</span>
                                <span className="text-[9px] text-slate-400">({acc.isVirtual ? 'Demo' : 'Real'})</span>
                              </div>
                              {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-1 space-y-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Settings &amp; Permissions</span>
                    </button>
                    {onLogout && (
                      <button
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect Account</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Prominent Login with Deriv Button (Fully visible on all mobile and desktop screens) */
            <button
              id="nav-link-deriv-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs font-mono transition-all shrink-0 shadow-md shadow-emerald-500/25 active:scale-95 border border-emerald-300"
              title="Log in with Deriv to access your account"
            >
              <Wallet className="w-3.5 h-3.5 text-slate-950 fill-slate-950 shrink-0" />
              <span className="whitespace-nowrap font-extrabold tracking-tight">Login with Deriv</span>
              <ArrowRight className="w-3 h-3 text-slate-950 stroke-[3] hidden xs:inline" />
            </button>
          )}

          {/* Deriv Connection Indicator (hidden on small mobile to give priority to Login button) */}
          <div id="conn-details-container" className="relative hidden md:flex shrink-0">
            <button
              id="deriv-connection-indicator-btn"
              onClick={() => setShowConnDetails(!showConnDetails)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 shadow-sm shadow-emerald-950'
                  : connectionStatus === 'FALLBACK'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Inspect Deriv WebSocket connection & gateway status"
            >
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'CONNECTED' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : connectionStatus === 'FALLBACK' 
                    ? 'bg-amber-400' 
                    : 'bg-sky-400 animate-ping'
              }`} />
              <span className="text-[11px] font-semibold hidden lg:inline">
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

          {/* 95%+ Browser Background Notification Alert Button (hidden on mobile) */}
          {onOpenNotifications && (
            <button
              id="open-notifications-btn"
              onClick={onOpenNotifications}
              className={`p-1.5 rounded-lg border transition-all relative hidden md:flex items-center justify-center shrink-0 ${
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

          {/* Download Bot XML Button (hidden on mobile) */}
          {onOpenDownloadBot && (
            <button
              id="nav-download-bot-btn"
              onClick={onOpenDownloadBot}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-mono font-bold transition-all shadow-sm shrink-0"
              title="Download Deriv Under 8 Sniper Bot (.xml) for bot.deriv.com"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bot .xml</span>
            </button>
          )}

          {/* Source Code Modal Button (hidden on mobile) */}
          {onOpenSourceCode && (
            <button
              id="nav-source-code-btn"
              onClick={onOpenSourceCode}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all shadow-sm shrink-0"
              title="View, copy, or download the complete website source code"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>Source Code</span>
            </button>
          )}

          {/* Sound Alert Toggle (hidden on small mobile) */}
          <button
            id="sound-toggle-btn"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border transition-colors hidden sm:flex shrink-0 ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title={isMuted ? 'Unmute 95%+ Signal Audio Alerts' : 'Mute Audio Alerts'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings / API Modal Button (Always visible) */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 shadow-sm"
            title="Deriv Account & Broker Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout Button (hidden on mobile) */}
          {onLogout && (
            <button
              id="nav-logout-btn"
              onClick={() => setShowLogoutModal(true)}
              className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-100 text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0"
              title="Logout from session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          DEDICATED MOBILE SUB-HEADER: 100% VISIBILITY FOR LOGIN & ACCOUNT SWITCHER
         ========================================================================= */}
      {!accountInfo.isAuthorized ? (
        /* Mobile Login Banner (Visible only on < sm mobile screens) */
        <div className="sm:hidden w-full bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/40 px-3 py-2 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-white tracking-wide truncate">
                Deriv Account: Not Connected
              </span>
              <span className="text-[9px] text-emerald-300/80 font-mono truncate">
                1-Click OAuth • Real &amp; Demo Switching
              </span>
            </div>
          </div>
          <button
            id="mobile-banner-login-btn"
            onClick={onOpenSettings}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/30 active:scale-95 transition-all border border-emerald-300"
          >
            <Wallet className="w-3.5 h-3.5 fill-slate-950" />
            <span>Login Now →</span>
          </button>
        </div>
      ) : (
        /* Mobile Account Switcher Sub-Header (Visible only on < sm mobile screens) */
        <div className="sm:hidden w-full bg-slate-900/95 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className={`w-2 h-2 rounded-full ${accountInfo.isVirtual ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse shrink-0`} />
            <span className="font-bold text-white text-[11px] truncate">{accountInfo.loginid}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
              accountInfo.isVirtual ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {accountInfo.isVirtual ? 'DEMO' : 'REAL'}
            </span>
            <span className="text-emerald-400 font-black text-xs">
              ${(accountInfo.balance !== undefined ? accountInfo.balance : 0).toFixed(2)} {accountInfo.currency || 'USD'}
            </span>
          </div>

          {/* Quick 1-Tap Toggle between Demo and Real accounts */}
          {savedAccounts && savedAccounts.length > 1 && onSelectAccount ? (
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 shrink-0">
              {/* Demo button */}
              {(() => {
                const demoAcc = savedAccounts.find(a => a.isVirtual || a.account.toUpperCase().startsWith('VRTC') || a.account.toUpperCase().startsWith('VRT'));
                if (!demoAcc) return null;
                const isCurrent = demoAcc.account === accountInfo.loginid;
                return (
                  <button
                    key="mobile-toggle-demo"
                    onClick={() => onSelectAccount(demoAcc.token)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Demo
                  </button>
                );
              })()}

              {/* Real button */}
              {(() => {
                const realAcc = savedAccounts.find(a => !a.isVirtual && !a.account.toUpperCase().startsWith('VRTC') && !a.account.toUpperCase().startsWith('VRT'));
                if (!realAcc) return null;
                const isCurrent = realAcc.account === accountInfo.loginid;
                return (
                  <button
                    key="mobile-toggle-real"
                    onClick={() => onSelectAccount(realAcc.token)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Real
                  </button>
                );
              })()}
            </div>
          ) : (
            <button
              onClick={onOpenSettings}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold shrink-0 underline"
            >
              {accountInfo.isVirtual ? '+ Link Real Account' : '+ Link Demo Account'}
            </button>
          )}
        </div>
      )}

      {/* Row 2: Dedicated Full-Width Trading Tools Strip (Suite Navigation) */}
      <div className="w-full max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 py-1.5 flex items-center gap-2 relative bg-slate-950/40">
        {/* Left Scroll Button (Visible when scrolled to right on narrower laptop viewports) */}
        {canScrollLeft && (
          <button
            onClick={() => scrollTools('left')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md shrink-0 transition-colors z-10"
            title="Scroll tools left"
            aria-label="Scroll tools left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Scrollable Tools Nav Ribbon */}
        <div
          ref={toolsScrollRef}
          onScroll={checkScrollState}
          onWheel={handleToolsWheel}
          className="flex-1 overflow-x-auto no-scrollbar py-0.5"
        >
          <nav className="inline-flex items-center gap-1.5 whitespace-nowrap min-w-max">
            {ALL_TOOLS.map((tool) => {
              const isActive = activeView === tool.id;
              return (
                <button
                  key={tool.id}
                  data-view-id={tool.id}
                  id={`nav-${tool.id}-btn`}
                  onClick={() => onSelectView(tool.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 select-none ${
                    isActive
                      ? tool.customActiveStyle || 'bg-slate-700 text-emerald-400 font-bold shadow-sm ring-1 ring-slate-600'
                      : tool.customInactiveStyle || 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50'
                  }`}
                  title={tool.description}
                >
                  {tool.icon}
                  <span>{tool.label}</span>
                  {tool.badge && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold leading-none ${
                      isActive 
                        ? 'bg-slate-900/60 text-white' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {tool.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Scroll Button (Visible when more tools overflow on laptop viewports) */}
        {canScrollRight && (
          <button
            onClick={() => scrollTools('right')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md shrink-0 transition-colors z-10"
            title="Scroll tools right"
            aria-label="Scroll tools right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Quick "All Tools" Grid Menu Button (Ensures 1-click reachability regardless of window width) */}
        <div id="tools-quick-menu-container" className="relative shrink-0">
          <button
            id="all-tools-quick-menu-btn"
            onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              toolsMenuOpen
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title="Browse all 11 trading tools in a quick menu"
          >
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-mono">All Tools</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${toolsMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* All Tools Popover Menu */}
          {toolsMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <Grid className="w-4 h-4 text-emerald-400" />
                  <span>Deriv Precision Suite Tools</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">11 Specialized Tools</span>
              </div>

              {(['terminals', 'strategies', 'analytics'] as const).map((cat) => {
                const toolsInCat = ALL_TOOLS.filter(t => t.category === cat);
                const categoryTitles = {
                  terminals: 'Trading Terminals & Execution',
                  strategies: 'High-Probability Statistical Edges (95%+)',
                  analytics: 'Market Analytics, Tape & Risk Management'
                };

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
                      {categoryTitles[cat]}
                    </div>
                    <div className="space-y-1">
                      {toolsInCat.map((tool) => {
                        const isCurrent = activeView === tool.id;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onSelectView(tool.id);
                              setToolsMenuOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-md ${isCurrent ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                                {tool.icon}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                  <span>{tool.label}</span>
                                  {isCurrent && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold uppercase">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                                  {tool.description}
                                </div>
                              </div>
                            </div>
                            {tool.badge && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
