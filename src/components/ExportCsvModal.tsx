import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { TradeRecord } from '../types';
import { exportTradesToCSV, copyTradesCSVToClipboard } from '../utils/exportCsv';

interface ExportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeRecord[];
  filteredTrades?: TradeRecord[];
  activeFilterName?: string;
}

export const ExportCsvModal: React.FC<ExportCsvModalProps> = ({
  isOpen,
  onClose,
  trades,
  filteredTrades,
  activeFilterName
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');

  if (!isOpen) return null;

  const targetTrades = exportScope === 'filtered' && filteredTrades && filteredTrades.length > 0 
    ? filteredTrades 
    : trades;

  const totalTrades = targetTrades.length;
  const wins = targetTrades.filter(t => t.outcome === 'WIN').length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const netProfit = targetTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const totalVolume = targetTrades.reduce((acc, t) => acc + (t.stake || 0), 0);

  const handleDownload = () => {
    const res = exportTradesToCSV(targetTrades, {
      filename: `deriv_trade_history_${exportScope === 'filtered' ? 'filtered_' : ''}${Date.now()}.csv`
    });

    if (res.success) {
      setDownloadSuccess(`Downloaded "${res.filename}" (${res.count} trades)`);
      setTimeout(() => {
        setDownloadSuccess(null);
      }, 4000);
    }
  };

  const handleCopy = async () => {
    const ok = await copyTradesCSVToClipboard(targetTrades);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 text-slate-100 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-csv-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close export window"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 id="export-csv-title" className="text-lg font-bold text-white flex items-center gap-2">
              Export Trade History
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CSV Format
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export comprehensive trade metrics for Excel, Google Sheets, or custom quantitative analysis
            </p>
          </div>
        </div>

        {/* Scope Selector if filtered list is different from total */}
        {filteredTrades && filteredTrades.length > 0 && filteredTrades.length !== trades.length && (
          <div className="bg-slate-950/70 p-1 rounded-xl border border-slate-800 flex text-xs font-mono">
            <button
              onClick={() => setExportScope('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all ${
                exportScope === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Trades ({trades.length})
            </button>
            <button
              onClick={() => setExportScope('filtered')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all ${
                exportScope === 'filtered'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Filtered: {activeFilterName || 'Current View'} ({filteredTrades.length})
            </button>
          </div>
        )}

        {/* Trade Batch Metrics Summary */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Records</div>
            <div className="text-base font-bold text-white mt-0.5">{totalTrades}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {totalTrades > 0 ? `${winRate.toFixed(1)}%` : '0%'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Net PnL</div>
            <div className={`text-base font-bold mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
            </div>
          </div>
        </div>

        {/* Data Columns Included Preview */}
        <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Included Analysis Columns (20 Fields):</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">UTF-8 RFC 4180</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            Trade ID, Date Local, Date UTC, Unix Time, Symbol, Contract Type, Target Strategy, Confidence %, Entry Price, Entry Digit, Exit Price, Exit Digit, Duration Ticks, Outcome, Stake, Payout, Net Profit, ROI %, Cumulative PnL, Account Mode.
          </p>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleDownload}
              disabled={totalTrades === 0}
              className={`flex-1 py-3 px-4 rounded-xl font-bold font-mono text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                totalTrades === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.99]'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download CSV File ({totalTrades})</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={totalTrades === 0}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-mono text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 hover:border-slate-600 shrink-0"
              title="Copy CSV raw text to clipboard to paste directly into Google Sheets (Ctrl+V)"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Spreadsheet Guide Callout */}
        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>How to use in your spreadsheets:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60">
              <strong className="text-slate-200">Google Sheets:</strong>
              <p className="mt-0.5">File &rarr; Import &rarr; Upload CSV, or click &quot;Copy to Clipboard&quot; and paste directly.</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60">
              <strong className="text-slate-200">Excel / Numbers:</strong>
              <p className="mt-0.5">Double click the downloaded file; UTF-8 BOM guarantees proper column parsing and symbols.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
