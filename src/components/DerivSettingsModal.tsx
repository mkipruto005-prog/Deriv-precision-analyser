import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  Shield, 
  LogOut, 
  Wallet, 
  Zap, 
  AlertTriangle,
  Eye,
  EyeOff,
  Globe,
  ArrowRight,
  Clipboard,
  Info,
  Check
} from 'lucide-react';
import { DerivAccountInfo } from '../types';
import { DerivOAuthAccount, getDerivOAuthUrl } from '../utils/derivOAuth';

interface DerivSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  apiToken: string;
  onSaveConfig: (appId: string, apiToken: string) => void;
  accountInfo: DerivAccountInfo;
  isLiveExecutionEnabled?: boolean;
  onToggleLiveExecution?: (enabled: boolean) => void;
  onLogout?: () => void;
  onAppLogout?: () => void;
  onSelectAccount?: (token: string) => void;
  savedAccounts?: DerivOAuthAccount[];
  onManualStrikeTest?: (stake: number) => void;
  currentSymbolName?: string;
  authError?: string | null;
}

export const DerivSettingsModal: React.FC<DerivSettingsModalProps> = ({
  isOpen,
  onClose,
  appId: initialAppId,
  apiToken: initialToken,
  onSaveConfig,
  accountInfo,
  isLiveExecutionEnabled = false,
  onToggleLiveExecution,
  onLogout,
  onAppLogout,
  onSelectAccount,
  savedAccounts = [],
  onManualStrikeTest,
  currentSymbolName = 'Volatility 100 (1s) Index',
  authError = null
}) => {
  const [appId, setAppId] = useState(initialAppId || '1089');
  const [apiToken, setApiToken] = useState(initialToken || '');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'token' | 'oauth'>('token');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testStake, setTestStake] = useState<number>(1);
  const [strikeSent, setStrikeSent] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setApiToken(initialToken || '');
  }, [initialToken]);

  useEffect(() => {
    setAppId(initialAppId || '1089');
  }, [initialAppId]);

  if (!isOpen) return null;

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim()) return;
    onSaveConfig(appId, apiToken.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setApiToken(text.trim());
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }
      }
    } catch {
      // ignore clipboard permission rejection
    }
  };

  const handleOAuthLogin = () => {
    const authUrl = getDerivOAuthUrl(appId);
    // CRITICAL: NEVER navigate window.location.href in an iframe!
    // Deriv sends X-Frame-Options: DENY which crashes iframes with a grey screen.
    // Opening in a new window/tab safely loads the official Deriv login.
    window.open(authUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStrike = () => {
    if (onManualStrikeTest) {
      onManualStrikeTest(testStake);
      setStrikeSent(true);
      setTimeout(() => setStrikeSent(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="close-deriv-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              Connect Deriv Account
            </h3>
            <p className="text-xs text-slate-400">
              Trade directly on Demo (VRTC) or Real (CR) accounts
            </p>
          </div>
        </div>

        {/* ACCOUNT IS AUTHORIZED: DASHBOARD & LIVE CONTROLS */}
        {accountInfo.isAuthorized ? (
          <div className="space-y-4">
            {/* Connected Account Card */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">STATUS: CONNECTED</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                  accountInfo.isVirtual 
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' 
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${accountInfo.isVirtual ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`} />
                  {accountInfo.isVirtual ? 'DEMO ACCOUNT (VRTC)' : 'REAL MONEY (CR)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">ACCOUNT LOGIN ID</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">{accountInfo.loginid}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">LIVE BALANCE</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    ${accountInfo.balance !== undefined ? accountInfo.balance.toFixed(2) : '0.00'} {accountInfo.currency || 'USD'}
                  </div>
                </div>
              </div>

              {/* Multi-Account Switcher */}
              {savedAccounts && savedAccounts.length > 1 && onSelectAccount && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono block mb-1.5">SWITCH SAVED ACCOUNT:</span>
                  <div className="flex flex-wrap gap-2">
                    {savedAccounts.map((acc) => {
                      const isCurrent = acc.account === accountInfo.loginid;
                      return (
                        <button
                          key={acc.account}
                          onClick={() => onSelectAccount(acc.token)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                            isCurrent
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                          }`}
                        >
                          {acc.account} ({acc.isVirtual ? 'Demo' : 'Real'})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Live Trade Mode Switcher */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Direct Trade Execution Mode</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isLiveExecutionEnabled
                      ? `Active: Real 1-tick contracts are placed directly on ${accountInfo.loginid}`
                      : 'Safe Mode: Trades are simulated locally with zero balance risk'}
                  </p>
                </div>

                {onToggleLiveExecution && (
                  <button
                    onClick={() => onToggleLiveExecution(!isLiveExecutionEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      isLiveExecutionEnabled
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isLiveExecutionEnabled ? '⚡ LIVE ON DERIV' : '🛡️ SIMULATION'}
                  </button>
                )}
              </div>

              {isLiveExecutionEnabled && !accountInfo.isVirtual && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Real Money Warning:</strong> Automated Sniper Bot strikes and manual trades will place real contracts with your live funds on Deriv.
                  </span>
                </div>
              )}
            </div>

            {/* Direct Quick Strike Test on Deriv */}
            {onManualStrikeTest && (
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">Direct 1-Tick Strike Test</div>
                  <span className="text-[11px] font-mono text-slate-400">{currentSymbolName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.35"
                      max="100"
                      value={testStake}
                      onChange={(e) => setTestStake(Math.max(0.35, parseFloat(e.target.value) || 1))}
                      className="w-16 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleStrike}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    {strikeSent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Order Transmitted!</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Strike Under 8 Contract Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Logout / Disconnect */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Connected securely via TLS WebSocket</span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Account</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* NOT AUTHORIZED: LOGIN INTERFACE */
          <div className="space-y-4">
            {/* Instant Virtual Demo Quick Action Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="uppercase tracking-wider text-emerald-300 font-mono">
                    Instant Virtual Demo Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  You can trade demo right now with $10,000 risk-free virtual balance on live Deriv ticks — no account, token, or registration required!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold shrink-0 transition-all shadow-md shadow-emerald-500/20 text-center"
              >
                Trade Demo Now &rarr;
              </button>
            </div>

            {/* Method Selection Tabs */}
            <div className="flex bg-slate-850 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                id="tab-token-login-btn"
                onClick={() => setActiveTab('token')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'token'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>API Token Login (Recommended)</span>
              </button>
              <button
                type="button"
                id="tab-oauth-login-btn"
                onClick={() => setActiveTab('oauth')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'oauth'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Deriv.com OAuth</span>
              </button>
            </div>

            {/* ERROR BANNER IF PREVIOUS ATTEMPT FAILED */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 w-full">
                  <div className="font-bold text-red-200 flex items-center justify-between">
                    <span>Authentication Rejected by Deriv</span>
                    <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono">Check Scopes & App ID</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px] leading-relaxed">{authError}</div>
                  
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-red-500/20 text-[11px] text-slate-300 space-y-1">
                    <div className="font-semibold text-white">How to fix this:</div>
                    <div className="text-slate-300 space-y-0.5">
                      <p>1. <strong>All Scopes Required:</strong> When generating the token on Deriv, tick <span className="text-emerald-300 font-semibold">Read</span>, <span className="text-emerald-300 font-semibold">Trade</span>, <span className="text-emerald-300 font-semibold">Trading Information</span>, and <span className="text-emerald-300 font-semibold">Admin</span>.</p>
                      <p>2. <strong>App ID for PAT tokens:</strong> If your token starts with <code className="text-cyan-300">pat_</code> and was created under developers.deriv.com, enter your registered <strong>App ID</strong> below instead of 1089.</p>
                      <p>3. <strong>Or trade risk-free:</strong> You can clear the token below to run purely on simulated Paper Trading.</p>
                    </div>
                  </div>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setApiToken('');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Clear Token &amp; Use Paper Simulation</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TOKEN TAB (DEFAULT & RECOMMENDED) */}
            {activeTab === 'token' ? (
              <div className="space-y-4">
                {/* 1-Click Alternative Callout Banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Easiest Method: 1-Click OAuth</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      No need to create tokens, select scopes, or copy keys.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('oauth')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0 transition-colors"
                  >
                    Use 1-Click Login &rarr;
                  </button>
                </div>

                {/* Step 1: Open Deriv in New Tab */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">1</span>
                      <span>Generate Deriv Token</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      Takes 10 seconds
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Open the official Deriv Token page in a new tab (switch to your <strong>Virtual Demo Account (VRTC...)</strong> if you want to trade Deriv Demo):
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="https://app.deriv.com/account/api-token"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <span>Deriv Trader's Hub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="https://developers.deriv.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-mono font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Deriv Developers Portal</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-900/70 p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Required Scope Checkboxes (Select All 4):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-1">
                      <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Read</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Trade</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Trading info</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Admin</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      ⚠️ <em>Deriv WebSocket rejects tokens if Admin or Trading Information is missing.</em>
                    </div>
                  </div>
                </div>

                {/* Step 2: Paste Token Form */}
                <form onSubmit={handleSaveToken} className="space-y-3.5 p-4 rounded-xl bg-slate-850 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">2</span>
                      <span>Paste Token & Confirm App ID</span>
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                      title="Paste token from clipboard"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                      <span>{isCopied ? 'Pasted!' : 'Paste'}</span>
                    </button>
                  </div>

                  {/* Token input */}
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                      <span>API TOKEN:</span>
                      {apiToken.startsWith('pat_') && (
                        <span className="text-cyan-400 font-bold">PAT Token Format</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="deriv-api-token-input"
                        type={showPassword ? 'text' : 'password'}
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder="Paste your Deriv API token (e.g. pat_... or a1-b2c3...)"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                        title={showPassword ? 'Hide token' : 'Show token'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Smart PAT Guidance */}
                  {apiToken.startsWith('pat_') && (
                    <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                        <Info className="w-3.5 h-3.5" />
                        <span>Personal Access Token (PAT) Detected</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        If you registered an app on <strong>developers.deriv.com</strong>, enter your assigned <strong>App ID</strong> below. If you created this token on Trader's Hub, keep <strong>1089</strong>.
                      </p>
                    </div>
                  )}

                  {/* App ID Input */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>DERIV APP ID:</span>
                      <span className="text-slate-500">Default: 1089</span>
                    </div>
                    <input
                      id="deriv-app-id-input"
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="1089"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Keep <strong>1089</strong> for standard Deriv accounts, or enter your custom app ID if registered on developers.deriv.com.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="deriv-connect-token-submit-btn"
                      disabled={!apiToken.trim()}
                      className={`flex-1 py-2.5 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                        !apiToken.trim()
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      {savedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                          <span>Connecting to Deriv...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Connect Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* OAUTH TAB EXPLANATION & GUIDANCE */
              <div className="space-y-4 p-4 rounded-xl bg-slate-850 border border-slate-800">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 leading-relaxed">
                    <div className="font-bold text-amber-100">Why Deriv OAuth doesn't redirect back to this app:</div>
                    <p className="text-slate-300">
                      Deriv's OAuth system strictly requires the redirect URL to be pre-registered in the Deriv Developer Portal. Because this development app runs on a dynamic preview URL (<code className="text-amber-300 text-[10px]">ais-dev-...</code>), Deriv's security policy will not redirect back to it.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>How to connect your logged-in account (Takes 15s):</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Since you are already logged into Deriv in your other tab, all you need is your API token:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-300">
                    <li>
                      Open your Deriv Token page:{' '}
                      <a
                        href="https://app.deriv.com/account/api-token"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>app.deriv.com/account/api-token</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      Name it (e.g. <strong>SniperBot</strong>), tick all boxes (<strong className="text-emerald-300">Read</strong>, <strong className="text-emerald-300">Trade</strong>, <strong className="text-emerald-300">Trading Info</strong>, <strong className="text-emerald-300">Admin</strong>) and click <strong>Create</strong>.
                    </li>
                    <li>
                      Copy the token, click the button below, and paste it.
                    </li>
                  </ol>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('token')}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Go to API Token Login Tab &rarr;</span>
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] text-slate-400 text-center">
                    Already have a token copied? Switch to the <button type="button" onClick={() => setActiveTab('token')} className="text-cyan-400 underline font-medium">API Token Login</button> tab to connect immediately.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Application Logout Option */}
        {onAppLogout && (
          <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Session: <strong className="text-slate-200">Admin (boyboy8076)</strong>
            </div>
            <button
              type="button"
              id="settings-app-logout-btn"
              onClick={() => {
                onClose();
                onAppLogout();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Logout from Deriv Precision Analyzer session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Logout from Analyzer</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

