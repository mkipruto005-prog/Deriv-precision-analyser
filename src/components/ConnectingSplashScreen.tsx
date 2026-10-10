import React, { useEffect, useState } from 'react';
import { BarChart3, Bot, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ConnectingSplashScreenProps {
  isOpen: boolean;
  onComplete: () => void;
  accountLoginId?: string;
  isVirtual?: boolean;
}

export const ConnectingSplashScreen: React.FC<ConnectingSplashScreenProps> = ({
  isOpen,
  onComplete,
  accountLoginId,
  isVirtual
}) => {
  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState('Connecting to Volatility Markets...');

  useEffect(() => {
    if (!isOpen) {
      setProgress(10);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 400);
          return 100;
        }

        const next = prev + Math.floor(Math.random() * 18) + 12;
        if (next >= 40 && next < 70) {
          setStatusText('Authorizing Deriv Trading Account...');
        } else if (next >= 70 && next < 95) {
          setStatusText('Subscribing to Real-Time Digit Streams...');
        } else if (next >= 95) {
          setStatusText(accountLoginId ? `Ready! Connected to ${accountLoginId}` : 'Ready! Welcome to Trading Hub');
        }
        return Math.min(next, 100);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isOpen, onComplete, accountLoginId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Banner */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              PRECISION SCALPER
            </span>
            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              LIVE
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 tracking-widest uppercase">
            TRADING HUB
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">
            Welcome to Precision Scalper
          </h2>
          <p className="text-xs text-slate-400">
            Empowering your financial journey.
          </p>
        </div>

        {/* Progress Bar & Status */}
        <div className="space-y-2 pt-2">
          <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden relative">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span className="text-emerald-400 font-semibold">{statusText}</span>
            <span className="font-bold text-white">{progress}%</span>
          </div>
        </div>

        {/* Feature Icons Row */}
        <div className="grid grid-cols-3 gap-3 pt-3">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-300">Advanced Charts</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-300">Trading Bots</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-300">Auto-Strike</span>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-[11px] text-slate-500 font-mono pt-1">
          Preparing a seamless trading experience for you
        </p>
      </div>
    </div>
  );
};
