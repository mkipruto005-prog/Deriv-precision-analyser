import { TradeRecord } from '../types';

export interface ExportCsvOptions {
  filename?: string;
  sourceLabel?: string;
}

/**
 * Escapes a cell value strictly compliant with RFC 4180 CSV standard.
 * If value contains commas, quotes, or newlines, wraps in quotes and doubles inner quotes.
 */
function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a timestamp into local readable string YYYY-MM-DD HH:mm:ss
 */
function formatLocalDateTime(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generates an RFC 4180-compliant CSV string from an array of TradeRecord objects,
 * optimized for Excel, Google Sheets, LibreOffice Calc, and Apple Numbers.
 */
export function generateTradesCSVString(trades: TradeRecord[]): string {
  if (!trades || trades.length === 0) {
    return '';
  }

  // Sorted chronologically (oldest first) so running cumulative PnL flows forward
  const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  const headers = [
    'Trade ID',
    'Date Local',
    'Date UTC (ISO)',
    'Timestamp (Unix)',
    'Market / Symbol',
    'Contract Type',
    'Target / Strategy',
    'Confidence (%)',
    'Entry Price',
    'Entry Last Digit',
    'Exit Price',
    'Exit Last Digit',
    'Duration (Ticks)',
    'Outcome',
    'Stake (USD)',
    'Payout (USD)',
    'Net Profit/Loss (USD)',
    'ROI (%)',
    'Cumulative PnL (USD)',
    'Account Mode'
  ];

  let cumulativePnL = 0;

  const rows = sortedTrades.map((t) => {
    cumulativePnL = parseFloat((cumulativePnL + (t.profit || 0)).toFixed(2));
    const roi = t.stake > 0 ? ((t.profit / t.stake) * 100).toFixed(2) : '0.00';
    const isLive = t.id.startsWith('DERIV_');
    const accountMode = isLive ? 'Live Real Deriv' : 'Virtual Demo';

    return [
      escapeCSV(t.id),
      escapeCSV(formatLocalDateTime(t.timestamp)),
      escapeCSV(new Date(t.timestamp * 1000).toISOString()),
      escapeCSV(t.timestamp),
      escapeCSV(t.symbol),
      escapeCSV(t.contractType),
      escapeCSV(t.target || t.contractType),
      escapeCSV(typeof t.confidence === 'number' ? t.confidence.toFixed(1) : t.confidence),
      escapeCSV(typeof t.entryQuote === 'number' ? t.entryQuote.toFixed(4) : t.entryQuote),
      escapeCSV(t.entryDigit !== undefined ? t.entryDigit : ''),
      escapeCSV(typeof t.exitQuote === 'number' ? t.exitQuote.toFixed(4) : t.exitQuote),
      escapeCSV(t.exitDigit !== undefined ? t.exitDigit : ''),
      escapeCSV(t.ticksElapsed || 1),
      escapeCSV(t.outcome),
      escapeCSV(typeof t.stake === 'number' ? t.stake.toFixed(2) : t.stake),
      escapeCSV(typeof t.payout === 'number' ? t.payout.toFixed(2) : t.payout),
      escapeCSV(typeof t.profit === 'number' ? t.profit.toFixed(2) : t.profit),
      escapeCSV(roi),
      escapeCSV(cumulativePnL.toFixed(2)),
      escapeCSV(accountMode)
    ].join(',');
  });

  // Include UTF-8 BOM so Microsoft Excel opens special characters and UTF-8 seamlessly
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser download of the trade history CSV file.
 */
export function exportTradesToCSV(
  trades: TradeRecord[],
  options?: ExportCsvOptions
): { success: boolean; filename: string; count: number; error?: string } {
  if (!trades || trades.length === 0) {
    return {
      success: false,
      filename: '',
      count: 0,
      error: 'No trades available to export'
    };
  }

  try {
    const csvContent = generateTradesCSVString(trades);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const filename = options?.filename || `deriv_trade_history_${dateStamp}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      count: trades.length
    };
  } catch (err: any) {
    console.error('Failed to export CSV:', err);
    return {
      success: false,
      filename: '',
      count: 0,
      error: err?.message || 'Failed to generate CSV file'
    };
  }
}

/**
 * Copies the CSV text directly to clipboard so users can paste directly into Google Sheets or Excel.
 */
export async function copyTradesCSVToClipboard(trades: TradeRecord[]): Promise<boolean> {
  if (!trades || trades.length === 0) return false;
  try {
    const csvContent = generateTradesCSVString(trades);
    // Strip BOM for clipboard pasting
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    await navigator.clipboard.writeText(cleanContent);
    return true;
  } catch (err) {
    console.error('Failed to copy CSV to clipboard:', err);
    return false;
  }
}
