import React, { useState } from 'react';
import { 
  Calculator, 
  ShieldAlert, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  Scale,
  Sparkles,
  Info
} from 'lucide-react';
import { CONTRACT_INFO } from '../constants/symbols';

export const RiskCalculator: React.FC = () => {
  const [accountBalance, setAccountBalance] = useState<number>(1000);
  const [contractType, setContractType] = useState<keyof typeof CONTRACT_INFO>('DIGITDIFF');
  const [winRateInput, setWinRateInput] = useState<number>(96.5);
  const [riskPreference, setRiskPreference] = useState<'conservative' | 'balanced' | 'aggressive'>('conservative');

  const contract = CONTRACT_INFO[contractType];
  const payoutDecimal = contract.payoutRate / 100; // e.g. 0.098 for Differs, 0.95 for Rise/Fall
  const winProbability = winRateInput / 100;
  const lossProbability = 1 - winProbability;

  // Kelly Formula: f* = (p * b - q) / b
  const b = payoutDecimal;
  const p = winProbability;
  const q = lossProbability;
  const rawKellyFraction = b > 0 ? (p * b - q) / b : 0;
  const kellyPct = Math.max(0, Math.min(100, rawKellyFraction * 100));

  // Risk multiplier
  const riskFraction = riskPreference === 'conservative' ? 0.25 : riskPreference === 'balanced' ? 0.5 : 1.0;
  const recommendedFraction = (kellyPct * riskFraction) / 100;
  const recommendedStake = Math.max(1, parseFloat((accountBalance * recommendedFraction).toFixed(2)));

  // Recovery calculator for 95%+ win systems
  const consecutiveWinsNeeded = Math.ceil(1 / payoutDecimal);

  return (
    <div id="risk-calculator-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Kelly &amp; Risk Sizing Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                Mathematical Capital Protection
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Optimal stake sizing for high-win-rate Deriv contracts to prevent ruin and maximize compounding
            </p>
          </div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Balance */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Trading Balance ($)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 font-mono text-sm">$</span>
            <input
              type="number"
              min="10"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Math.max(10, Number(e.target.value)))}
              className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Contract Type */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Deriv Contract Spec
          </label>
          <select
            value={contractType}
            onChange={(e) => {
              const val = e.target.value as keyof typeof CONTRACT_INFO;
              setContractType(val);
              if (val === 'DIGITDIFF') setWinRateInput(96.5);
              else if (val === 'DIGITOVER' || val === 'DIGITUNDER') setWinRateInput(95.6);
              else if (val === 'CALL' || val === 'PUT') setWinRateInput(95.2);
            }}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
          >
            {Object.entries(CONTRACT_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name} (+{info.payoutRate}%)
              </option>
            ))}
          </select>
        </div>

        {/* Win Rate Expectation */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>Model Win Probability</span>
            <span className="text-emerald-400 font-mono">{winRateInput}%</span>
          </label>
          <input
            type="range"
            min="80"
            max="99"
            step="0.1"
            value={winRateInput}
            onChange={(e) => setWinRateInput(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer mt-2"
          />
        </div>
      </div>

      {/* Recommended Sizing Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sizing Recommendation */}
        <div className="md:col-span-2 p-5 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-emerald-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-400" />
              Optimal Kelly Position Size
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              {(['conservative', 'balanced', 'aggressive'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRiskPreference(mode)}
                  className={`px-2 py-0.5 rounded capitalize text-[11px] font-semibold transition-colors ${
                    riskPreference === mode
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400">Recommended Stake</div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                ${recommendedStake}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {((recommendedStake / accountBalance) * 100).toFixed(1)}% of balance
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400">Est. Profit / Trade</div>
              <div className="text-2xl font-black font-mono text-slate-100">
                +${(recommendedStake * payoutDecimal).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Payout: +{contract.payoutRate}%
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400">Raw Full Kelly</div>
              <div className="text-2xl font-black font-mono text-teal-400">
                {kellyPct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Using {riskPreference === 'conservative' ? 'Quarter' : riskPreference === 'balanced' ? 'Half' : 'Full'} Kelly
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <strong>Kelly Criterion Formula:</strong> <code className="text-emerald-300 font-mono text-xs">f* = (p·b - q) / b</code>.
            With a validated {winRateInput}% win rate on {contract.name}, mathematical growth is maximized by sizing stakes proportionally while retaining a safety buffer against variance.
          </div>
        </div>

        {/* Safety Rules for Deriv */}
        <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Anti-Ruin Safeguards
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <div className="font-bold text-amber-400">Do NOT use 10x Martingale on Differs</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Because Differs pays ~10%, traditional Martingale requires 11x multiplier on loss. Instead, use safe split recovery over {consecutiveWinsNeeded} trades.
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <div className="font-bold text-emerald-400">Daily Profit Cap Target</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Target: <strong>+${(accountBalance * 0.05).toFixed(2)}</strong> (5% daily growth). Stop trading once hit.
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <div className="font-bold text-rose-400">Maximum Stop Loss Guard</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Cap loss at <strong>-${(accountBalance * 0.10).toFixed(2)}</strong> (10% max daily drawdown).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
