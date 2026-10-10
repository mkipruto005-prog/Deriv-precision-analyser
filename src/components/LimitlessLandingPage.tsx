import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Activity, 
  Download, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  TrendingUp, 
  Sparkles,
  FileText,
  Zap,
  Target,
  Radio,
  ArrowRight,
  Wallet,
  Globe,
  ExternalLink
} from 'lucide-react';
import { soundEngine } from '../services/audioAlert';
import { getDerivOAuthUrl } from '../utils/derivOAuth';

// Official WhatsApp brand icon SVG
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84-1.56 1.56-3.64 2.41-5.83 2.41-1.43 0-2.83-.38-4.06-1.11l-.29-.17-3.02.79.81-2.94-.19-.3a8.163 8.163 0 0 1-1.25-4.52c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.79.98-.15.17-.3.19-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
  </svg>
);

interface LimitlessLandingPageProps {
  onLoginSuccess: () => void;
  onLoginWithDeriv?: () => void;
  appId?: string;
}

export const LimitlessLandingPage: React.FC<LimitlessLandingPageProps> = ({ 
  onLoginSuccess,
  onLoginWithDeriv,
  appId = '1089'
}) => {
  // Input states
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(true);
  const [installInstruction, setInstallInstruction] = useState<string | null>(null);

  // Status & modal states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [isCopyTradingModalOpen, setIsCopyTradingModalOpen] = useState<boolean>(false);

  // Direct WhatsApp contact link (Phone number: +254726152651 kept strictly in link href, hidden from visual display)
  const whatsappUrl = "https://wa.me/254726152651?text=Hello%20Admin%2C%20I%20would%20like%20to%20get%20login%20credentials%20for%20Deriv%20Precision%20Analyzer";

  // Trigger 3rd party Deriv OAuth login flow
  const handleDerivOAuthLogin = () => {
    soundEngine.playTickPing();
    if (onLoginWithDeriv) {
      onLoginWithDeriv();
    } else {
      const url = getDerivOAuthUrl(appId);
      window.location.href = url;
    }
  };

  // Handle Login validation
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('Please enter both username and password.');
      soundEngine.playTickPing();
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('You must accept the terms and conditions to proceed.');
      soundEngine.playTickPing();
      return;
    }

    setIsSubmitting(true);

    // Verify Admin credentials:
    // Username: boyboy8076
    // Password: boyboy8076@gmail.com
    setTimeout(() => {
      if (cleanUsername === 'boyboy8076' && cleanPassword === 'boyboy8076@gmail.com') {
        soundEngine.playSignalAlert();
        try {
          localStorage.setItem('deriv_precision_auth_session', 'true');
          localStorage.setItem('deriv_precision_auth_user', 'boyboy8076');
          localStorage.setItem('limitless_auth_session', 'true');
        } catch (err) {
          console.warn('LocalStorage error', err);
        }
        onLoginSuccess();
      } else {
        setIsSubmitting(false);
        setErrorMessage('Invalid credentials. Please tap WhatsApp below to request your authorized login credentials from the administrator.');
        soundEngine.playTickPing();
      }
    }, 450);
  };

  const handleOpenWhatsApp = () => {
    soundEngine.playTickPing();
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      id="deriv-precision-landing-page"
      className="min-h-screen w-full bg-[#070a16] text-slate-100 flex flex-col items-center justify-between p-3 sm:p-6 font-sans relative overflow-x-hidden selection:bg-emerald-400 selection:text-black"
    >
      {/* Dynamic Background Mesh Gradients & Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[350px] bg-gradient-to-b from-cyan-500/15 via-emerald-500/10 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-[360px] h-[360px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* =========================================================================
          PWA INSTALL TOP BANNER
         ========================================================================= */}
      {showInstallBanner && (
        <div className="w-full max-w-md flex items-center justify-between py-2 px-3.5 mb-2 rounded-2xl bg-[#0e142e]/90 border border-emerald-500/25 text-xs z-20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-200 font-bold text-[11px] tracking-wide">Deriv Mobile App Edition</span>
              <span className="text-slate-400 text-[10px]">Add to homescreen for fast trading</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInstallInstruction('To install on your mobile device: Tap your browser menu (⋮ or Share) and select "Add to Home screen".');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-teal-500/25 hover:from-emerald-500/40 hover:to-teal-500/40 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Install app</span>
            </button>
            <button
              onClick={() => {
                setShowInstallBanner(false);
                setInstallInstruction(null);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {installInstruction && (
        <div className="w-full max-w-md py-2.5 px-3.5 mb-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] z-20 flex items-center justify-between shadow-lg">
          <span>{installInstruction}</span>
          <button 
            onClick={() => setInstallInstruction(null)}
            className="text-emerald-400 hover:text-emerald-200 ml-2 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          MAIN BRAND HEADER & DECORATED EMBLEM
         ========================================================================= */}
      <div className="w-full max-w-md flex flex-col items-center pt-2 pb-3 z-10 text-center">
        
        {/* Top Micro-Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-amber-500/15 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300 shadow-sm mb-2 backdrop-blur-md">
          <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
          <span className="tracking-wider uppercase text-[10px] text-emerald-200">Deriv Synthetic Indices Engine</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-amber-300 text-[10px] font-bold">LIVE 95%+</span>
        </div>

        {/* Decorated Circular Radar / Precision Heartbeat Emblem */}
        <div className="relative my-2">
          {/* Animated decorative glow aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 via-emerald-500/25 to-amber-500/20 blur-2xl animate-pulse" />
          
          {/* Outer Ring with decorative dashed accents */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[2.5px] border-emerald-400/60 shadow-[0_0_35px_rgba(16,185,129,0.35)] bg-gradient-to-b from-[#0e1738] via-[#090e24] to-[#060917] flex items-center justify-center relative z-10 transition-transform duration-300 hover:scale-105 p-1">
            
            {/* Inner Precision Target Ring */}
            <div className="w-full h-full rounded-full border border-cyan-400/30 flex items-center justify-center relative bg-radial from-cyan-900/30 to-transparent">
              
              {/* Corner crosshairs */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-amber-400 rounded-full" />

              {/* Heartbeat ECG Pulse Wave SVG in Vibrant Neon Cyan & Emerald */}
              <svg 
                className="w-14 h-14 sm:w-16 sm:h-16 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title: DERIV PRECISION ANALYZER */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-center mt-2 flex items-center justify-center flex-wrap gap-x-2.5">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-teal-300 tracking-wide drop-shadow-[0_2px_12px_rgba(6,182,212,0.4)]">
            DERIV PRECISION
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-300 tracking-wide drop-shadow-[0_2px_12px_rgba(245,158,11,0.4)]">
            ANALYZER
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1 text-center tracking-wide">
          Algorithmic Parity, Under 8 &amp; Matches Trading System
        </p>

        {/* Live Feature Ticker Strip */}
        <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Even/Odd 95%+
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-cyan-400">
            <Zap className="w-3 h-3" /> Under 8 Sniper
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-amber-400">
            <Target className="w-3 h-3" /> Matches Tool
          </span>
        </div>
      </div>

      {/* =========================================================================
          DECORATED LOGIN CARD
         ========================================================================= */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#111736]/95 via-[#0e142e]/95 to-[#0b0f24]/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(16,185,129,0.12)] backdrop-blur-xl z-10 flex flex-col gap-4 relative overflow-hidden">
        
        {/* Top glowing ambient highlight line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* =========================================================================
            PRIMARY METHOD: 1-CLICK DERIV OAUTH 2.0 LOGIN (LIKE DBTRADERS)
           ========================================================================= */}
        <div className="w-full flex flex-col gap-2.5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider text-emerald-400 uppercase font-mono flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Recommended Login</span>
            </span>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              REAL &amp; DEMO
            </span>
          </div>

          {/* Large, Glowing Login with Deriv Button */}
          <button
            id="landing-deriv-oauth-btn"
            type="button"
            onClick={handleDerivOAuthLogin}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 active:scale-[0.99] text-slate-950 font-black text-sm sm:text-base tracking-wide transition-all shadow-[0_0_30px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2.5 border border-emerald-300 group"
          >
            <Wallet className="w-5 h-5 text-slate-950 fill-slate-950 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold tracking-tight">LOGIN WITH DERIV</span>
            <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="text-[11px] text-slate-300 text-center leading-tight">
            Log in with your Deriv email or Google account to grant secure access. Automatically loads your <strong className="text-cyan-300 font-bold">Demo</strong> and <strong className="text-emerald-400 font-bold">Real</strong> accounts with 1-click switching.
          </p>

          {/* Instant Guest / Practice Demo Terminal Button */}
          <button
            id="landing-guest-demo-btn"
            type="button"
            onClick={() => {
              soundEngine.playTickPing();
              onLoginSuccess();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>TRY FREE DEMO TERMINAL (NO ACCOUNT NEEDED)</span>
          </button>
        </div>

        {/* OR Divider with subtle glow */}
        <div className="flex items-center gap-3 my-0.5">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#283366]" />
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Or Admin Login</span>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#283366]" />
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-medium flex items-start gap-2.5 animate-fade-in shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Username Field */}
          <div>
            <label className="text-xs sm:text-sm font-bold text-amber-400 mb-1.5 flex items-center justify-between tracking-wide">
              <span>Username</span>
              <span className="text-[10px] text-slate-400 font-normal">Registered Trader ID</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                id="login-username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter username"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#151c3d] border border-[#2b3769] hover:border-cyan-400/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all shadow-inner font-sans"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-xs sm:text-sm font-bold text-amber-400 mb-1.5 flex items-center justify-between tracking-wide">
              <span>Password</span>
              <span className="text-[10px] text-slate-400 font-normal">Secure Access Key</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#151c3d] border border-[#2b3769] hover:border-cyan-400/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all shadow-inner font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-cyan-300 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 rounded bg-[#151c3d] border-[#2b3769] text-emerald-400 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-400"
            />
            <label htmlFor="terms-checkbox" className="text-xs text-slate-300 font-medium cursor-pointer select-none">
              I accept the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsTermsModalOpen(true);
                }}
                className="text-cyan-300 hover:text-cyan-200 underline font-semibold transition-colors"
              >
                terms and conditions
              </button>
            </label>
          </div>

          {/* Strict Security & Credential Sharing Warning */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 via-rose-950/40 to-amber-950/60 border border-amber-500/50 shadow-inner flex items-start gap-2.5 text-left">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex-1 text-[11px] leading-relaxed">
              <div className="flex items-center gap-1.5 mb-1 font-bold text-amber-300 text-[10px] tracking-wider uppercase">
                <span>Security Notice</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/25 border border-amber-500/40 text-amber-200 font-bold">
                  STRICT POLICY
                </span>
              </div>
              <p className="text-slate-200 text-[11px] leading-snug">
                Sharing login credentials without admin permission is strictly prohibited. Unauthorized sharing or redistribution will result in <strong className="text-amber-300 font-bold">immediate account suspension</strong>, permanent IP/device blacklisting, and complete forfeiture of analyzer access.
              </p>
            </div>
          </div>

          {/* Decorated Emerald LOGIN Button */}
          <button
            id="landing-login-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] via-[#10b981] to-[#059669] hover:from-[#00c853] hover:to-[#047857] active:scale-[0.99] text-slate-950 font-black text-sm sm:text-base tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 mt-1"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                VERIFYING CREDENTIALS...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>LOGIN TO ANALYZER</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* OR Divider with subtle glow */}
        <div className="flex items-center gap-3 my-0.5">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#283366]" />
          <span className="text-[11px] font-bold text-slate-400 tracking-widest">OR</span>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#283366]" />
        </div>

        {/* WHATSAPP Action Button (Vivid WhatsApp brand gradient + glow) */}
        <button
          id="landing-whatsapp-btn"
          type="button"
          onClick={handleOpenWhatsApp}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#25D366] via-[#20ba5c] to-[#128C7E] hover:from-[#20ba5c] hover:to-[#0f7a6e] active:scale-[0.99] text-white font-black text-sm sm:text-base tracking-wider transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)] flex items-center justify-center gap-2.5"
        >
          <WhatsAppIcon className="w-5 h-5 text-white" />
          <span>CONTACT VIA WHATSAPP</span>
        </button>

        {/* COPY TRADING Decorated Pill Button */}
        <div className="flex justify-center pt-1">
          <button
            id="landing-copy-trading-btn"
            type="button"
            onClick={() => {
              soundEngine.playTickPing();
              setIsCopyTradingModalOpen(true);
            }}
            className="px-8 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>COPY TRADING SERVICE</span>
          </button>
        </div>

        {/* Footer Guidance Note */}
        <p className="text-center text-[11px] sm:text-xs text-slate-400 font-medium pt-1">
          Contact administrator on WhatsApp to obtain your trading credentials
        </p>
      </div>

      {/* Educational & Compliance Notice */}
      <footer className="w-full max-w-md text-center py-3 text-[10px] text-slate-500 z-10 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Deriv Precision Analyzer • High Accuracy Trading Intelligence</span>
        </div>
        <span>Protected Proprietary Models • Strictly For Authorized Users</span>
      </footer>

      {/* =========================================================================
          COPY TRADING MODAL
         ========================================================================= */}
      {isCopyTradingModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-[#0f1530] border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Deriv Copy Trading Service</h3>
                  <p className="text-[11px] text-amber-300">Automated High-Accuracy Mirroring</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCopyTradingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Mirror institutional-grade algorithmic trades directly onto your personal Deriv account. 
              Our engine synchronizes verified Even/Odd parity reversals, Under 8 safe haven runs, and 95%+ confidence triggers.
            </p>

            <div className="space-y-2 py-1">
              <div className="p-2.5 rounded-xl bg-[#161e42] border border-[#2b376d] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-200">Continuous execution on Volatility Indices (10, 25, 50, 75, 100)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161e42] border border-[#2b376d] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs text-slate-200">Customizable risk multiplier, dynamic Martingale &amp; stop loss limits</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161e42] border border-[#2b376d] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-200">Automated synchronization via safe Deriv API Read/Trade tokens</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  soundEngine.playTickPing();
                  window.open("https://wa.me/254726152651?text=Hello%20Admin%2C%20I%20am%20interested%20in%20activating%20Copy%20Trading%20service%20for%20Deriv%20Precision%20Analyzer", "_blank");
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Request Copy Trading on WhatsApp</span>
              </button>
              
              <button
                onClick={() => setIsCopyTradingModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TERMS AND CONDITIONS MODAL
         ========================================================================= */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-[#0f1530] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="font-bold text-base text-white">Terms &amp; Conditions</h3>
              </div>
              <button 
                onClick={() => setIsTermsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3.5 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#141b3d] border border-[#25305c]">
                <h4 className="font-bold text-emerald-400 mb-1">1. Educational &amp; Probability Analysis</h4>
                <p>
                  Deriv Precision Analyzer delivers algorithmic probability calculations, digit distribution models, and volatility heuristics. Financial trading carries inherent risk, and historical calculations do not guarantee future performance.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#141b3d] border border-[#25305c]">
                <h4 className="font-bold text-amber-400 mb-1">2. Risk Management &amp; Capital Protection</h4>
                <p>
                  Synthetic index trading involves real market risk. Users must apply disciplined position sizing, strictly define risk parameters, and never trade funds they cannot afford to risk.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40">
                <h4 className="font-bold text-amber-300 mb-1.5 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>3. Strict Credential Policy &amp; Immediate Forfeiture</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Access credentials granted by the administrator are strictly individual, encrypted, and non-transferable. Sharing credentials without express admin permission is a critical breach that will result in <strong className="text-amber-200">immediate and permanent account suspension</strong>, device hardware and IP address blacklisting, and irrevocable forfeiture of access to the Deriv Precision Analyzer tool.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setAcceptedTerms(true);
                  setIsTermsModalOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>I Understand &amp; Accept Terms</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
