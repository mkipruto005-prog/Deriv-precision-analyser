import React, { useState, useEffect, useRef } from 'react';
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
  Clipboard,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  Copy,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight,
  Wifi,
  HelpCircle
} from 'lucide-react';
import { DerivAccountInfo } from '../types';
import { 
  DerivOAuthAccount, 
  getDerivOAuthUrl, 
  extractDerivCredentials, 
  verifyDerivToken, 
  TokenVerificationResult 
} from '../utils/derivOAuth';

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
  const [activeTab, setActiveTab] = useState<'oauth' | 'token' | 'diagnostics' | 'manage'>('oauth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testStake, setTestStake] = useState<number>(1);
  const [strikeSent, setStrikeSent] = useState(false);
  const [isCopiedRedirect, setIsCopiedRedirect] = useState(false);
  const [isCopiedToken, setIsCopiedToken] = useState(false);
  const [oauthPastedInput, setOauthPastedInput] = useState('');
  const [inputGuidance, setInputGuidance] = useState<string | null>(null);
  
  // Real-time verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<TokenVerificationResult | null>(null);
  const [detectedAccounts, setDetectedAccounts] = useState<DerivOAuthAccount[]>([]);

  // Diagnostics test state
  const [diagnosticPing, setDiagnosticPing] = useState<number | null>(null);
  const [diagnosticStatus, setDiagnosticStatus] = useState<string>('Ready to test connection');
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);

  useEffect(() => {
    setApiToken(initialToken || '');
  }, [initialToken]);

  useEffect(() => {
    setAppId(initialAppId || '1089');
  }, [initialAppId]);

  // When authorized, default to manage tab
  useEffect(() => {
    if (accountInfo.isAuthorized) {
      setActiveTab('manage');
      setIsSubmitting(false);
    }
  }, [accountInfo.isAuthorized]);

  if (!isOpen) return null;

  const currentRedirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://ais-pre-uwor5ihwm7yxe5kryjipat-53685294932.europe-west2.run.app';

  const handleCopyRedirectUrl = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentRedirectUrl);
        setIsCopiedRedirect(true);
        setTimeout(() => setIsCopiedRedirect(false), 2500);
      }
    } catch {}
  };

  const handleSmartPaste = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          applyRawInput(text);
          setIsCopiedToken(true);
          setTimeout(() => setIsCopiedToken(false), 2000);
        }
      }
    } catch {}
  };

  const handleTestToken = async (tokenToTest: string) => {
    const cleanToken = tokenToTest.trim();
    if (!cleanToken) return;

    // Check input format first
    if (/^(CR|VRTC|VRT|MF|MLT)\d+$/i.test(cleanToken)) {
      setInputGuidance(`Notice: "${cleanToken.toUpperCase()}" is your Account ID. To connect, Deriv requires an API Token instead of your Account ID.`);
      return;
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanToken)) {
      setInputGuidance('Notice: You entered an email address. Deriv requires an API Token to connect without asking for your password.');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setInputGuidance(null);

    const result = await verifyDerivToken(cleanToken, appId);
    setIsVerifying(false);
    setVerificationResult(result);
  };

  const applyRawInput = (rawText: string) => {
    setInputGuidance(null);
    const extracted = extractDerivCredentials(rawText);

    if (extracted.type === 'accounts_list' && extracted.accounts && extracted.accounts.length > 0) {
      setDetectedAccounts(extracted.accounts);
      if (extracted.primaryToken) {
        setApiToken(extracted.primaryToken);
        handleTestToken(extracted.primaryToken);
      }
      if (extracted.appId) {
        setAppId(extracted.appId);
      }
    } else if (extracted.type === 'single_token' && extracted.primaryToken) {
      setApiToken(extracted.primaryToken);
      if (extracted.appId) setAppId(extracted.appId);
      handleTestToken(extracted.primaryToken);
    } else {
      setApiToken(rawText.trim());
      if (extracted.message) {
        setInputGuidance(extracted.message);
      } else {
        handleTestToken(rawText.trim());
      }
    }
  };

  const handleSaveToken = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = apiToken.trim();
    if (!cleanToken) return;

    // Check if user entered an account login ID or email
    if (/^(CR|VRTC|VRT|MF|MLT)\d+$/i.test(cleanToken)) {
      setInputGuidance(`Notice: "${cleanToken.toUpperCase()}" is an Account Login ID. Deriv requires an API Token (from app.deriv.com/account/api-token) to securely link.`);
      return;
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanToken)) {
      setInputGuidance('Notice: You entered an email. Deriv requires an API Token rather than an email to connect.');
      return;
    }

    setInputGuidance(null);
    setIsSubmitting(true);
    setSavedSuccess(true);
    onSaveConfig(appId, cleanToken);

    // Give visual feedback and auto-close if connected
    setTimeout(() => {
      setSavedSuccess(false);
      setIsSubmitting(false);
    }, 2500);
  };

  const handleConnectVerified = () => {
    if (!apiToken.trim()) return;
    onSaveConfig(appId, apiToken.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleOAuthLoginPopup = () => {
    const authUrl = getDerivOAuthUrl(appId);
    window.open(authUrl, '_blank', 'noopener,noreferrer');
  };

  const handleParseOAuthInput = () => {
    if (!oauthPastedInput.trim()) return;
    applyRawInput(oauthPastedInput);
    setOauthPastedInput('');
  };

  const handleStrike = () => {
    if (onManualStrikeTest) {
      onManualStrikeTest(testStake);
      setStrikeSent(true);
      setTimeout(() => setStrikeSent(false), 2500);
    }
  };

  // Test live connection to Deriv WebSocket gateway directly
  const runDiagnosticsTest = () => {
    setIsTestingPing(true);
    setDiagnosticStatus('Connecting to wss://ws.derivws.com/websockets/v3...');
    const start = Date.now();
    try {
      const testWs = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}&l=en`);
      const timeout = setTimeout(() => {
        try { testWs.close(); } catch {}
        setIsTestingPing(false);
        setDiagnosticStatus('Connection timed out after 3.5s. Check network / firewall.');
      }, 3500);

      testWs.onopen = () => {
        setDiagnosticStatus('Socket OPEN! Measuring round-trip ping latency...');
        testWs.send(JSON.stringify({ ping: 1 }));
      };

      testWs.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          const res = JSON.parse(event.data);
          if (res.msg_type === 'ping') {
            const rtt = Date.now() - start;
            setDiagnosticPing(rtt);
            setDiagnosticStatus(`Success! Deriv WebSocket is 100% reachable with ${rtt}ms latency.`);
          }
        } catch {}
        setIsTestingPing(false);
        try { testWs.close(); } catch {}
      };

      testWs.onerror = () => {
        clearTimeout(timeout);
        setIsTestingPing(false);
        setDiagnosticStatus('WebSocket connection failed. Deriv servers may be blocked by your local network or VPN.');
      };
    } catch (e: any) {
      setIsTestingPing(false);
      setDiagnosticStatus(`Error: ${e?.message || 'Failed to initialize WebSocket'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto">
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white leading-tight">
                Connect Deriv Account
              </h3>
              {accountInfo.isAuthorized && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  CONNECTED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Link your Demo (VRTC) or Real (CR) account using any method
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-850 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar gap-1 text-xs">
          <button
            type="button"
            id="tab-oauth-login-btn"
            onClick={() => setActiveTab('oauth')}
            className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>1-Click Login</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
              activeTab === 'oauth' ? 'bg-slate-950/30 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              BEST
            </span>
          </button>

          <button
            type="button"
            id="tab-token-login-btn"
            onClick={() => setActiveTab('token')}
            className={`flex-1 min-w-[100px] py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'token'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 shrink-0" />
            <span>API Token</span>
          </button>

          <button
            type="button"
            id="tab-diagnostics-btn"
            onClick={() => setActiveTab('diagnostics')}
            className={`flex-1 min-w-[100px] py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 shrink-0" />
            <span>Diagnostics</span>
          </button>

          {accountInfo.isAuthorized && (
            <button
              type="button"
              id="tab-manage-account-btn"
              onClick={() => setActiveTab('manage')}
              className={`flex-1 min-w-[100px] py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'manage'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Manage</span>
            </button>
          )}
        </div>

        {/* ALREADY CONNECTED BANNER */}
        {accountInfo.isAuthorized && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Connected: {accountInfo.loginid}</span>
                <span className="text-emerald-400 font-mono ml-2">
                  (${accountInfo.balance !== undefined ? accountInfo.balance.toFixed(2) : '0.00'} {accountInfo.currency || 'USD'})
                </span>
                <div className="text-[10px] text-slate-400">
                  {accountInfo.isVirtual ? 'Virtual Demo Account' : 'Real Money Account'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold font-mono text-[11px]"
            >
              View Controls &rarr;
            </button>
          </div>
        )}

        {/* INPUT GUIDANCE / ASSISTANCE BANNER */}
        {inputGuidance && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-start gap-2.5 text-xs text-amber-200 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 w-full">
              <div className="font-bold text-amber-100">Helpful Notice</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{inputGuidance}</p>
              <a
                href="https://app.deriv.com/account/api-token"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold underline font-mono text-[11px] pt-1"
              >
                <span>Click here to open the Deriv Token Creation page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* ERROR BANNER IF PREVIOUS ATTEMPT FAILED */}
        {authError && !accountInfo.isAuthorized && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 w-full">
              <div className="font-bold text-red-200 flex items-center justify-between">
                <span>Deriv Authentication Notice</span>
                <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono">
                  Info
                </span>
              </div>
              <div className="text-slate-300 font-mono text-[11px] leading-relaxed">{authError}</div>
              
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-red-500/20 text-[11px] text-slate-300 space-y-1">
                <div className="font-semibold text-white">How to Resolve:</div>
                <p>1. Open <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-bold">Deriv API Token Settings</a></p>
                <p>2. Ensure <strong>Read</strong> and <strong>Trade</strong> checkboxes are checked when creating the token.</p>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setApiToken('');
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset &amp; Try Fresh Token</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: API TOKEN (PRIMARY METHOD) */}
        {activeTab === 'token' && (
          <div className="space-y-4">
            {/* Step 1: Open Deriv Generator Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">1</span>
                  <span>Get Token from Deriv in 15 Seconds</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  Guaranteed &amp; Safe
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <p>
                  1. Click below to open <strong>Deriv API Token Settings</strong> in a new tab:
                </p>
                <a
                  href="https://app.deriv.com/account/api-token"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 my-2"
                >
                  <span>Open Deriv API Token Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p>
                  2. <span className="text-amber-300 font-semibold">Demo vs. Real:</span> On Deriv Trader's Hub, switch to your <strong>Demo (VRTC...)</strong> account to trade demo, or <strong>Real (CR...)</strong> for live funds.
                </p>
                <p>
                  3. Enter any name (e.g. <em>PrecisionBot</em>), check the <strong>Read</strong> and <strong>Trade</strong> boxes, click <strong>Create</strong>, and copy the token.
                </p>
              </div>

              {/* Scopes checklist */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-white flex items-center justify-between">
                  <span>Required Checkboxes on Deriv:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Both Needed</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                  <div className="flex items-center gap-1 text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20 font-bold">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Read</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20 font-bold">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Trade</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 bg-slate-950/30 px-2 py-1 rounded border border-slate-800">
                    <Check className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Trading Info</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 bg-slate-950/30 px-2 py-1 rounded border border-slate-800">
                    <Check className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Admin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Paste and Validate Token */}
            <form onSubmit={handleSaveToken} className="space-y-3.5 p-4 rounded-xl bg-slate-850 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">2</span>
                  <span>Paste Token &amp; Link</span>
                </span>
                <button
                  type="button"
                  onClick={handleSmartPaste}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-mono transition-colors bg-cyan-950/30 px-2.5 py-1 rounded-lg border border-cyan-500/30"
                  title="Paste from clipboard"
                >
                  {isCopiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                  <span>{isCopiedToken ? 'Pasted!' : 'Paste from Clipboard'}</span>
                </button>
              </div>

              {/* Token Input */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    id="deriv-api-token-input"
                    type={showPassword ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => {
                      setApiToken(e.target.value);
                      setVerificationResult(null);
                      setInputGuidance(null);
                    }}
                    placeholder="Paste Deriv API token (e.g. a1b2c3d4e5f6...)"
                    className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <div className="absolute right-2.5 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-white"
                      title={showPassword ? 'Hide token' : 'Show token'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Paste your API token here (not your login ID or password)</span>
                  {apiToken.trim() && (
                    <button
                      type="button"
                      onClick={() => handleTestToken(apiToken)}
                      disabled={isVerifying}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 font-mono"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Test Token</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* LIVE VERIFICATION FEEDBACK BOX */}
              {isVerifying && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300 animate-pulse">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                  <span>Contacting Deriv WebSocket servers to verify token permissions...</span>
                </div>
              )}

              {verificationResult && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                  verificationResult.isValid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-950/40 border-red-500/40 text-red-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      {verificationResult.isValid ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span>
                        {verificationResult.isValid ? 'Token Verified with Deriv!' : 'Verification Result'}
                      </span>
                    </div>
                    {verificationResult.latencyMs && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {verificationResult.latencyMs}ms ping
                      </span>
                    )}
                  </div>

                  {verificationResult.isValid ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20">
                          <span className="text-slate-400 block text-[9px]">ACCOUNT:</span>
                          <span className="font-bold text-white">{verificationResult.loginid}</span>
                          <span className="text-slate-400 ml-1">
                            ({verificationResult.isVirtual ? 'Demo' : 'Real'})
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20">
                          <span className="text-slate-400 block text-[9px]">BALANCE:</span>
                          <span className="font-bold text-emerald-400">
                            ${verificationResult.balance?.toFixed(2)} {verificationResult.currency || 'USD'}
                          </span>
                        </div>
                      </div>

                      {verificationResult.scopes && (
                        <div className="text-[10px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 font-mono">SCOPES:</span>
                          {verificationResult.scopes.map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleConnectVerified}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Connect {verificationResult.loginid} Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1 text-[11px] leading-relaxed">
                      <p className="font-mono text-red-300">{verificationResult.errorMessage}</p>
                      <p className="text-slate-300">
                        Check that the token was copied completely from <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">app.deriv.com/account/api-token</a>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
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
                  disabled={!apiToken.trim() || isSubmitting}
                  className={`flex-1 py-2.5 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                    !apiToken.trim() || isSubmitting
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Connected Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Save &amp; Connect Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 1: DERIV OAUTH 2.0 (1-CLICK LOGIN) */}
        {activeTab === 'oauth' && (
          <div className="space-y-4">
            {/* OAuth Quick Connect Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Step 1: Official Deriv Sign-In (Recommended)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  App ID: {appId}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  Click below to open Deriv's official authentication page in a new window:
                </p>

                {/* 4-Step Walkthrough */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono pt-1">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-bold block">1. Sign In</span>
                    <span>Enter Deriv email or Google/Apple</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-bold block">2. Authorize</span>
                    <span>Click "Allow access" to grant trade permission</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-bold block">3. Redirect</span>
                    <span>Tokens automatically returned</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-bold block">4. Connected</span>
                    <span>Toggle Demo / Real in 1 click!</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {/* Primary Button: Direct Redirect (100% works on mobile and avoids popup blockers) */}
                <button
                  type="button"
                  id="open-oauth-direct-redirect-btn"
                  onClick={() => {
                    const authUrl = getDerivOAuthUrl(appId);
                    window.location.href = authUrl;
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-mono font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 border border-emerald-300 active:scale-[0.99]"
                >
                  <Globe className="w-4 h-4" />
                  <span>Log In with Deriv.com (Direct Redirect)</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>

                {/* Secondary Button: Popup in new tab (Desktop alternative) */}
                <button
                  type="button"
                  id="open-oauth-popup-btn"
                  onClick={handleOAuthLoginPopup}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-mono text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Or Open in New Tab / Window</span>
                </button>
              </div>
            </div>

            {/* Paste Redirect URL Helper */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>Step 2: Instant Address Bar Link Extractor</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                After logging in on Deriv, if Deriv opens a page with tokens in your browser address bar (<code className="text-cyan-300 text-[10px]">?acct1=...&token1=...</code>), paste the full URL or text below:
              </p>

              <div className="space-y-2">
                <textarea
                  value={oauthPastedInput}
                  onChange={(e) => setOauthPastedInput(e.target.value)}
                  placeholder="Paste URL or tokens (e.g. https://oauth.deriv.com/redirect?acct1=CR123&token1=xyz...)"
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
                />

                <button
                  type="button"
                  onClick={handleParseOAuthInput}
                  disabled={!oauthPastedInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract Accounts &amp; Connect Instantly</span>
                </button>
              </div>

              {detectedAccounts.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Discovered {detectedAccounts.length} Account(s):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedAccounts.map((acc) => (
                      <button
                        key={acc.account}
                        type="button"
                        onClick={() => {
                          setApiToken(acc.token);
                          onSaveConfig(appId, acc.token);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold transition-all flex items-center gap-1.5"
                      >
                        <span className={`w-2 h-2 rounded-full ${acc.isVirtual ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                        <span>{acc.account} ({acc.isVirtual ? 'Demo' : 'Real'}) &rarr; Connect</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom App ID / Redirect URL helper */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between text-white font-bold">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>App Redirect URL for Developers</span>
                </span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-400">
                If you registered an app on <strong>developers.deriv.com</strong>, set this redirect URL:
              </p>
              
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="truncate font-mono text-[10px] text-slate-300">
                  <span className="text-cyan-300">{currentRedirectUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRedirectUrl}
                  className="px-2 py-1 rounded bg-slate-850 hover:bg-slate-750 text-slate-200 text-[10px] font-mono shrink-0 flex items-center gap-1 border border-slate-700"
                >
                  {isCopiedRedirect ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedRedirect ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIAGNOSTICS & NETWORK TEST */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4 p-4 rounded-xl bg-slate-850 border border-slate-800">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Deriv Live Server Diagnostics</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                Gateway: ws.derivws.com
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Use this tool to test live connectivity between your browser and Deriv's WebSocket servers.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status:</span>
                <span className="font-mono font-bold text-emerald-300">{diagnosticStatus}</span>
              </div>
              {diagnosticPing !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Latency:</span>
                  <span className="font-mono font-bold text-emerald-400">{diagnosticPing}ms</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={runDiagnosticsTest}
              disabled={isTestingPing}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
            >
              {isTestingPing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Pinging Deriv WebSocket...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Run Live Connection Test</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="font-semibold text-white">Connection Tips:</div>
              <p>• If the ping test succeeds, your browser can reach Deriv API servers without firewall blocks.</p>
              <p>• If connection fails, check if your local network or VPN blocks WebSocket (WSS) connections.</p>
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE CONNECTED ACCOUNT */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Active Deriv Account</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  accountInfo.isVirtual 
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30' 
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {accountInfo.isVirtual ? 'DEMO (VRTC)' : 'REAL MONEY'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ACCOUNT ID:</span>
                  <span className="text-white font-bold text-sm">{accountInfo.loginid || 'Active'}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">BALANCE:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    ${(accountInfo.balance !== undefined ? accountInfo.balance : 0).toFixed(2)} {accountInfo.currency || 'USD'}
                  </span>
                </div>
              </div>

              {/* Scopes badge */}
              {accountInfo.scopes && accountInfo.scopes.length > 0 && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                  <span className="text-slate-400 font-mono text-[10px] block">PERMISSIONS:</span>
                  <div className="flex flex-wrap gap-1">
                    {accountInfo.scopes.map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Trading Execution Safety Switch */}
            {onToggleLiveExecution && (
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Real Execution Switch</span>
                    <span className="text-[11px] text-slate-400">
                      {isLiveExecutionEnabled
                        ? 'Active: Real orders are placed on your connected Deriv account.'
                        : 'Simulated: Signals run in zero-risk demo practice mode.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleLiveExecution(!isLiveExecutionEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      isLiveExecutionEnabled
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                        : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {isLiveExecutionEnabled ? 'LIVE ACTIVE' : 'SIMULATION ONLY'}
                  </button>
                </div>
              </div>
            )}

            {/* Switch Between Saved Accounts */}
            {savedAccounts.length > 1 && onSelectAccount && (
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">Switch Linked Account</span>
                <div className="flex flex-wrap gap-2">
                  {savedAccounts.map(acc => (
                    <button
                      key={acc.account}
                      type="button"
                      onClick={() => onSelectAccount(acc.token)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        acc.account === accountInfo.loginid
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                      }`}
                    >
                      {acc.account} ({acc.isVirtual ? 'Demo' : 'Real'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Disconnect Account */}
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setActiveTab('token');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Deriv Account</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
