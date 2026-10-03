import React, { useState } from 'react';
import {
  X,
  Download,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Bot,
  FileCode2,
  Play,
  ShieldAlert,
  Wallet,
  Check,
  Copy,
  FolderOpen,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { DerivSymbol, DerivAccountInfo } from '../types';
import { BotConfig } from './Under8BotPanel';
import { downloadDerivBotXmlFile } from '../services/derivBotXml';
import { DERIV_SYMBOLS } from '../constants/symbols';

interface DerivBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: DerivSymbol;
  botConfig: BotConfig;
  accountInfo: DerivAccountInfo;
  apiToken: string;
  appId: string;
  onSaveConfig: (appId: string, apiToken: string) => void;
  bestEntryDigit: number;
  isLiveExecutionEnabled: boolean;
  onToggleLiveExecution: (enabled: boolean) => void;
  defaultTab?: 'download' | 'link';
}

export const DerivBotModal: React.FC<DerivBotModalProps> = ({
  isOpen,
  onClose,
  symbol,
  botConfig,
  accountInfo,
  apiToken: initialToken,
  appId: initialAppId,
  onSaveConfig,
  bestEntryDigit,
  isLiveExecutionEnabled,
  onToggleLiveExecution,
  defaultTab = 'download'
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'link'>(defaultTab);
  const [apiToken, setApiToken] = useState(initialToken || '');
  const [appId, setAppId] = useState(initialAppId || '1089');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<string | null>(null);
  const [tokenSavedSuccess, setTokenSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string>(symbol.id || '1HZ100V');

  // Keep selectedSymbolId in sync with current symbol when modal opens
  React.useEffect(() => {
    if (symbol?.id) {
      setSelectedSymbolId(symbol.id);
    }
  }, [symbol?.id, isOpen]);

  // Martingale / Stake controls
  const [modalStrategy, setModalStrategy] = useState<'recovery' | 'flat'>('recovery');
  const [modalMultiplier, setModalMultiplier] = useState<number>(2.0); // 2.0 = Double
  const [modalStake, setModalStake] = useState<number>(botConfig.baseStake || 1.0);
  const [modalTakeProfit, setModalTakeProfit] = useState<number>(botConfig.takeProfit || 5.0);
  const [modalStopLoss, setModalStopLoss] = useState<number>(25.0);

  if (!isOpen) return null;

  const activeTargetSymbol =
    DERIV_SYMBOLS.find((s) => s.id === selectedSymbolId) || symbol;

  const handleDownloadXmlFor = (symId: string, symName: string) => {
    downloadDerivBotXmlFile({
      symbolId: symId,
      symbolName: symName,
      baseStake: modalStake,
      stakeStrategy: modalStrategy,
      recoveryMultiplier: modalMultiplier,
      maxConsecutiveLosses: modalStrategy === 'recovery' ? 3 : 2,
      takeProfit: modalTakeProfit,
      stopLoss: modalStopLoss,
      barrier: 8,
      durationTicks: 1,
      optimalDigit: bestEntryDigit,
      minWinRate: botConfig.minWinRate
    });

    setDownloadTarget(symId);
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      setDownloadTarget(null);
    }, 4000);
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(appId, apiToken);
    setTokenSavedSuccess(true);
    setTimeout(() => setTokenSavedSuccess(false), 2500);
  };

  const handleCopyDbotUrl = () => {
    navigator.clipboard.writeText('https://bot.deriv.com');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Deriv Bot Connection &amp; Export</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  UNDER 8 SNIPER
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Download the official Deriv DBot XML file or link your live Deriv account directly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 shrink-0 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-3 px-4 font-mono font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'download'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Download Bot (.xml for bot.deriv.com)</span>
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`py-3 px-4 font-mono font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'link'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>2. Link Live Deriv Account (Direct API)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200">
          {activeTab === 'download' ? (
            /* DOWNLOAD DBOT XML TAB */
            <div className="space-y-5">
              {/* CRITICAL OVER VS UNDER WARNING BANNER */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>CRITICAL DERIV DBOT CHECK: WHY LOSSES HAPPEN</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In Deriv DBot, if you change any dropdown, Deriv often resets Block 2 back to <strong>Purchase Over</strong>. Look at your trade icon:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-start gap-2">
                    <ArrowDownRight className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-300">✅ CORRECT: Purchase Under (↘)</div>
                      <div className="text-[11px] text-emerald-200/80">Wins on digits: 0, 1, 2, 3, 4, 5, 6, 7 (~80-90% win rate)</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start gap-2">
                    <ArrowUpRight className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-300">❌ WRONG: Purchase Over (↗)</div>
                      <div className="text-[11px] text-rose-200/80">Loses on 0, 1, 2, 3, 4, 5, 6, 7. Only wins on 9! (90% loss rate)</div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-amber-300/90 font-medium">
                  👉 In <strong>Block 2 ("Purchase conditions")</strong> on bot.deriv.com, always verify the dropdown says: <strong>Purchase [ Under ▼ ]</strong>.
                </div>
              </div>

              {/* Bot summary configuration badge */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80 flex-wrap gap-2">
                  <span className="font-mono text-slate-400 uppercase">Select Target Asset for Bot File</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <FileCode2 className="w-3.5 h-3.5" /> Deriv DBot (XML) Format
                  </span>
                </div>

                {/* Target Asset Selector Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-slate-400">Choose Market (baked into XML file):</label>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Selected: <strong>{activeTargetSymbol.name} ({activeTargetSymbol.id})</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Active Market Chip */}
                    <button
                      type="button"
                      onClick={() => setSelectedSymbolId(symbol.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedSymbolId === symbol.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="font-bold text-xs font-mono truncate">{symbol.name}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Current Market ({symbol.id})</div>
                      </div>
                      {selectedSymbolId === symbol.id && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>

                    {/* Vol 100 (1s) Chip if not already the active symbol */}
                    {symbol.id !== '1HZ100V' && (
                      <button
                        type="button"
                        onClick={() => setSelectedSymbolId('1HZ100V')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          selectedSymbolId === '1HZ100V'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-bold text-xs font-mono truncate">Vol 100 (1s)</div>
                          <div className="text-[10px] text-emerald-400 font-mono">1s Fast Ticks (1HZ100V)</div>
                        </div>
                        {selectedSymbolId === '1HZ100V' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    )}

                    {/* Vol 100 Index if not already the active symbol */}
                    {symbol.id !== 'R_100' && (
                      <button
                        type="button"
                        onClick={() => setSelectedSymbolId('R_100')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          selectedSymbolId === 'R_100'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-bold text-xs font-mono truncate">Vol 100 Index</div>
                          <div className="text-[10px] text-slate-400 font-mono">Standard (R_100)</div>
                        </div>
                        {selectedSymbolId === 'R_100' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    )}

                    {/* Vol 50 Index as 3rd option if either active is 1HZ100V or R_100 */}
                    {(symbol.id === '1HZ100V' || symbol.id === 'R_100') && (
                      <button
                        type="button"
                        onClick={() => setSelectedSymbolId('1HZ50V')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          selectedSymbolId === '1HZ50V'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-bold text-xs font-mono truncate">Vol 50 (1s)</div>
                          <div className="text-[10px] text-slate-400 font-mono">1s Ticks (1HZ50V)</div>
                        </div>
                        {selectedSymbolId === '1HZ50V' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Staking Strategy & Martingale Toggle */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-slate-400">Stake Management Strategy:</label>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {modalStrategy === 'recovery' && modalMultiplier === 2.0 && '2.0x Double on Loss (Martingale)'}
                      {modalStrategy === 'recovery' && modalMultiplier === 4.3 && '4.3x Full Under 8 Recovery'}
                      {modalStrategy === 'flat' && 'Flat Staking ($1.00 constant)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalStrategy('recovery');
                        setModalMultiplier(2.0);
                        setModalStopLoss(25.0);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        modalStrategy === 'recovery' && modalMultiplier === 2.0
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold text-emerald-300">🔥 2.0x Double (Martingale)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">$1.00 ➔ $2.00 ➔ $4.00 on loss</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalStrategy('recovery');
                        setModalMultiplier(4.3);
                        setModalStopLoss(30.0);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        modalStrategy === 'recovery' && modalMultiplier === 4.3
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold text-teal-300">🎯 4.3x Full Under 8 Recovery</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">1 win recovers 100% loss + profit</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalStrategy('flat');
                        setModalMultiplier(1.0);
                        setModalStopLoss(5.0);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        modalStrategy === 'flat'
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold text-slate-300">🛡️ Flat Stake ($1.00)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Zero martingale, constant stake</div>
                    </button>
                  </div>
                </div>

                {/* Quick Base Stake selector */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-slate-400">Base Stake Amount:</span>
                  <div className="flex gap-1.5 font-mono text-xs">
                    {[0.5, 1.0, 2.0, 5.0].map((sVal) => (
                      <button
                        key={sVal}
                        type="button"
                        onClick={() => setModalStake(sVal)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                          modalStake === sVal
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        ${sVal.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Target Asset</div>
                    <div className="font-bold text-white mt-0.5 truncate">{activeTargetSymbol.name}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Contract &amp; Barrier</div>
                    <div className="font-bold text-emerald-400 mt-0.5">Under 8 (1 Tick)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Base Stake / Strategy</div>
                    <div className="font-bold text-white mt-0.5">
                      ${modalStake.toFixed(2)} ({modalStrategy === 'recovery' ? `${modalMultiplier}x Martingale` : 'Flat'})
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Take Profit / Stop Loss</div>
                    <div className="font-bold text-white mt-0.5">
                      +${modalTakeProfit} / -${modalStopLoss}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Download Action */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-850 to-teal-950/30 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download Under 8 Bot ({modalMultiplier > 1 ? `${modalMultiplier}x Martingale` : 'Flat'})</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    Pre-configured XML for {activeTargetSymbol.name} with ${modalStake.toFixed(2)} Base Stake, {modalMultiplier > 1 ? `${modalMultiplier}x Doubling Martingale` : 'Flat Stake'}, and 3-Loss Stop Loss Cutoff.
                  </p>
                </div>
                <button
                  id="modal-download-xml-btn"
                  onClick={() => handleDownloadXmlFor(activeTargetSymbol.id, activeTargetSymbol.name)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all shrink-0 hover:scale-[1.02]"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Downloaded {downloadTarget}!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download XML Bot</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step-by-step installation instructions for bot.deriv.com */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  <span>How to Load &amp; Run on Your Deriv Account:</span>
                </h4>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      1
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Go to Deriv Bot platform</div>
                      <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>Open</span>
                        <a
                          href="https://bot.deriv.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline font-mono inline-flex items-center gap-1 font-bold"
                        >
                          bot.deriv.com <ExternalLink className="w-3 h-3" />
                        </a>
                        <span>and log in with your Deriv Demo or Real Account.</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      2
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Click "Bot Builder" &rarr; "Import" (Folder icon)</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        In the top navigation menu of Deriv Bot, click <strong>Bot Builder</strong>, then click the <strong>Import</strong> icon (looks like a folder or cloud).
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      3
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Select the downloaded .xml file</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Choose <strong>Local</strong> or <strong>My Computer</strong> and select the <code className="text-emerald-300">Deriv_Under8_Sniper_Bot_{symbol.id}.xml</code> file.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      4
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-amber-300">Quick Check Block 2 (Purchase Under)</div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        Scroll to <strong>Block 2 ("Purchase conditions")</strong> and make sure the dropdown says <strong>Purchase [ Under ▼ ]</strong> (with a ↘ icon). If Deriv reset it to <em>Over</em>, tap it and select <strong>Under</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      5
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Click "Run Bot"</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Click the green <strong>Run</strong> button in the top right. Deriv Bot will now execute 1-tick Under 8 contracts with automated Take Profit ($5), Stop Loss ($5), and 2-consecutive-loss cutoff!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* LINK LIVE DERIV ACCOUNT TAB */
            <div className="space-y-5">
              {/* Account Status Card */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Deriv Account Status</span>
                  {accountInfo.isAuthorized ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>LINKED ({accountInfo.isVirtual ? 'DEMO' : 'REAL'})</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono">
                      NOT LINKED (RUNNING IN PAPER SIMULATION)
                    </span>
                  )}
                </div>

                {accountInfo.isAuthorized ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                      <div className="text-slate-400 text-[10px]">Login ID</div>
                      <div className="font-bold text-white text-sm mt-0.5">{accountInfo.loginid}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                      <div className="text-slate-400 text-[10px]">Account Type</div>
                      <div className="font-bold text-emerald-400 text-sm mt-0.5">
                        {accountInfo.isVirtual ? 'Virtual Demo Account' : 'Real Money Account'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                      <div className="text-slate-400 text-[10px]">Live Balance</div>
                      <div className="font-bold text-white text-sm mt-0.5">
                        ${accountInfo.balance?.toFixed(2)} {accountInfo.currency}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">
                    You can link your Deriv account token below to allow this web tool to execute real Under 8 contracts directly, or stay in zero-risk paper demo mode.
                  </p>
                )}
              </div>

              {/* Toggle Live Execution on Deriv Account */}
              {accountInfo.isAuthorized && (
                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>Live Account Trade Execution</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      When ON, Sniper Bot strikes will execute real 1-tick contracts on your {accountInfo.loginid} account.
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleLiveExecution(!isLiveExecutionEnabled)}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow ${
                      isLiveExecutionEnabled
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span>{isLiveExecutionEnabled ? 'LIVE TRADING: ACTIVE' : 'PAPER SIMULATION MODE'}</span>
                  </button>
                </div>
              )}

              {/* API Token Input Form */}
              <form onSubmit={handleSaveToken} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Deriv API Token (Read &amp; Trade Scope)
                    </label>
                    <a
                      href="https://app.deriv.com/account/api-token"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>Get Deriv Token</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Paste your Deriv API token here..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <div className="mt-1.5 text-[11px] text-slate-400 space-y-1">
                    <p>
                      <strong>How to get your token:</strong> Log into Deriv &rarr; Account Settings &rarr; API Token &rarr; Choose a name &rarr; Tick <em>Read</em> and <em>Trade</em> &rarr; Generate Token.
                    </p>
                    <p className="text-slate-500">
                      Tokens are held only in local browser memory and sent exclusively over TLS directly to official Deriv WebSocket servers (<code className="text-slate-400">wss://ws.derivws.com</code>).
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {tokenSavedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Token Saved &amp; Connected!</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        <span>{accountInfo.isAuthorized ? 'Update Token & Reconnect' : 'Connect Deriv Account'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Target: {symbol.name} (Under 8, 1 Tick)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDbotUrl}
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedLink ? 'Copied bot.deriv.com!' : 'Copy bot.deriv.com'}</span>
            </button>
            <span>&bull;</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
