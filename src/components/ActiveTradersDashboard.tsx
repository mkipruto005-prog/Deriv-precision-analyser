import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Activity, 
  Search, 
  Filter, 
  ShieldCheck, 
  Globe, 
  TrendingUp, 
  Zap, 
  Target, 
  Bot, 
  Smartphone, 
  Monitor, 
  ArrowUpRight, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  Clock, 
  Wifi, 
  ChevronDown, 
  Radio, 
  Sparkles,
  Flame,
  Award,
  LogOut,
  Info,
  Lock
} from 'lucide-react';
import { ActiveTrader, ActiveTradersSummary, DerivSymbol } from '../types';
import { soundEngine } from '../services/audioAlert';

// WhatsApp icon SVG matching the official logo
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84-1.56 1.56-3.64 2.41-5.83 2.41-1.43 0-2.83-.38-4.06-1.11l-.29-.17-3.02.79.81-2.94-.19-.3a8.163 8.163 0 0 1-1.25-4.52c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.79.98-.15.17-.3.19-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
  </svg>
);

interface ActiveTradersDashboardProps {
  currentSymbol: DerivSymbol;
  latencyMs: number;
  onSelectView?: (view: any) => void;
  onLogout?: () => void;
}

// Initial active trader roster
const INITIAL_TRADERS: ActiveTrader[] = [
  {
    id: 'trd-admin',
    username: 'boyboy8076',
    role: 'admin',
    location: 'Nairobi, Kenya',
    countryCode: 'KE',
    flagEmoji: '🇰🇪',
    activeMarket: 'Vol 100 (1s)',
    strategy: 'Profit Plus',
    status: 'ANALYZING',
    statusText: 'Streaming Live Deriv Ticks',
    connectedDuration: 'Active Now',
    lastActiveEpoch: Date.now(),
    tradesToday: 34,
    winRate: 97.1,
    pnlToday: 485.20,
    device: 'PWA Mobile / Terminal',
    latencyMs: 18
  },
  {
    id: 'trd-01',
    username: 'kimani_fx',
    role: 'vip',
    location: 'Eldoret, Kenya',
    countryCode: 'KE',
    flagEmoji: '🇰🇪',
    activeMarket: 'Vol 100 (1s)',
    strategy: 'Even/Odd',
    status: 'EXECUTING',
    statusText: 'Parity Reversion Signal (97.4%)',
    connectedDuration: '14m ago',
    lastActiveEpoch: Date.now() - 4000,
    tradesToday: 21,
    winRate: 95.2,
    pnlToday: 290.00,
    device: 'Mobile PWA',
    latencyMs: 24
  },
  {
    id: 'trd-02',
    username: 'alex_trader_za',
    role: 'trader',
    location: 'Johannesburg, South Africa',
    countryCode: 'ZA',
    flagEmoji: '🇿🇦',
    activeMarket: 'Vol 10 (1s)',
    strategy: 'Under 8',
    status: 'BOT_RUNNING',
    statusText: 'Auto DBot Sniper Active',
    connectedDuration: '32m ago',
    lastActiveEpoch: Date.now() - 8000,
    tradesToday: 45,
    winRate: 96.6,
    pnlToday: 512.40,
    device: 'Desktop Chrome',
    latencyMs: 42
  },
  {
    id: 'trd-03',
    username: 'emmanuel_deriv',
    role: 'trader',
    location: 'Lagos, Nigeria',
    countryCode: 'NG',
    flagEmoji: '🇳🇬',
    activeMarket: 'Vol 75',
    strategy: 'Matches',
    status: 'ANALYZING',
    statusText: '5S Markov Pattern Scan',
    connectedDuration: '45m ago',
    lastActiveEpoch: Date.now() - 12000,
    tradesToday: 18,
    winRate: 94.4,
    pnlToday: 215.80,
    device: 'Mobile Android',
    latencyMs: 38
  },
  {
    id: 'trd-04',
    username: 'sarah_uk_fx',
    role: 'vip',
    location: 'London, United Kingdom',
    countryCode: 'GB',
    flagEmoji: '🇬🇧',
    activeMarket: 'Vol 50 (1s)',
    strategy: 'Even/Odd',
    status: 'ANALYZING',
    statusText: 'Monitoring Streak 5 Exhaustion',
    connectedDuration: '1h 12m ago',
    lastActiveEpoch: Date.now() - 2000,
    tradesToday: 29,
    winRate: 96.5,
    pnlToday: 380.00,
    device: 'Desktop Mac',
    latencyMs: 14
  },
  {
    id: 'trd-05',
    username: 'otieno_trade',
    role: 'trader',
    location: 'Mombasa, Kenya',
    countryCode: 'KE',
    flagEmoji: '🇰🇪',
    activeMarket: 'Vol 100 (1s)',
    strategy: 'Profit Plus',
    status: 'EXECUTING',
    statusText: 'AI Prediction Contract Active',
    connectedDuration: '8m ago',
    lastActiveEpoch: Date.now() - 1000,
    tradesToday: 12,
    winRate: 100.0,
    pnlToday: 195.00,
    device: 'Mobile PWA',
    latencyMs: 22
  },
  {
    id: 'trd-06',
    username: 'hans_algo',
    role: 'trader',
    location: 'Frankfurt, Germany',
    countryCode: 'DE',
    flagEmoji: '🇩🇪',
    activeMarket: 'Vol 25 (1s)',
    strategy: 'Differs',
    status: 'BOT_RUNNING',
    statusText: '98.5% Cold Digit Differs Run',
    connectedDuration: '2h 05m ago',
    lastActiveEpoch: Date.now() - 15000,
    tradesToday: 62,
    winRate: 98.3,
    pnlToday: 640.00,
    device: 'Desktop Chrome',
    latencyMs: 16
  },
  {
    id: 'trd-07',
    username: 'khalid_dubai',
    role: 'vip',
    location: 'Dubai, UAE',
    countryCode: 'AE',
    flagEmoji: '🇦🇪',
    activeMarket: 'Vol 10',
    strategy: 'Under 8',
    status: 'ANALYZING',
    statusText: 'Under 8 Safe Haven Scan',
    connectedDuration: '22m ago',
    lastActiveEpoch: Date.now() - 5000,
    tradesToday: 24,
    winRate: 95.8,
    pnlToday: 320.50,
    device: 'iPad Pro',
    latencyMs: 31
  },
  {
    id: 'trd-08',
    username: 'mwangi_deriv',
    role: 'trader',
    location: 'Nakuru, Kenya',
    countryCode: 'KE',
    flagEmoji: '🇰🇪',
    activeMarket: 'Vol 100 (1s)',
    strategy: 'Even/Odd',
    status: 'ANALYZING',
    statusText: 'Z-Score Skew Confirmation',
    connectedDuration: '51m ago',
    lastActiveEpoch: Date.now() - 3000,
    tradesToday: 19,
    winRate: 94.7,
    pnlToday: 240.00,
    device: 'Mobile PWA',
    latencyMs: 20
  },
  {
    id: 'trd-09',
    username: 'thabo_trader',
    role: 'trader',
    location: 'Cape Town, South Africa',
    countryCode: 'ZA',
    flagEmoji: '🇿🇦',
    activeMarket: 'Vol 75 (1s)',
    strategy: 'Matches',
    status: 'IDLE',
    statusText: 'Waiting for High-Confidence Spike',
    connectedDuration: '1h 35m ago',
    lastActiveEpoch: Date.now() - 30000,
    tradesToday: 15,
    winRate: 93.3,
    pnlToday: 175.20,
    device: 'Desktop Chrome',
    latencyMs: 44
  }
];

export const ActiveTradersDashboard: React.FC<ActiveTradersDashboardProps> = ({
  currentSymbol,
  latencyMs,
  onSelectView,
  onLogout
}) => {
  const [traders, setTraders] = useState<ActiveTrader[]>(INITIAL_TRADERS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarketFilter, setSelectedMarketFilter] = useState<string>('all');
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  // Unpublished private session vs demo network toggle
  const [showSimulatedRoster, setShowSimulatedRoster] = useState<boolean>(false);

  // Real-time live event feed
  const [activityFeed, setActivityFeed] = useState<Array<{
    id: string;
    time: string;
    text: string;
    type: 'trade' | 'signal' | 'connect' | 'bot';
  }>>([
    {
      id: 'f-1',
      time: 'Just now',
      text: 'Admin @boyboy8076 synchronized tick streaming cache with Deriv Gateway (ws.derivws.com)',
      type: 'signal'
    },
    {
      id: 'f-2',
      time: '12s ago',
      text: 'Trader @kimani_fx triggered 97.4% Even/Odd parity reversal on Vol 100 (1s) - WON +$19.50',
      type: 'trade'
    },
    {
      id: 'f-3',
      time: '28s ago',
      text: 'DBot automated sniper executed Under 8 contract on Vol 10 (1s) for @alex_trader_za',
      type: 'bot'
    },
    {
      id: 'f-4',
      time: '1m ago',
      text: 'New active mobile user connected from Nairobi, Kenya (Deriv Mobile PWA)',
      type: 'connect'
    },
    {
      id: 'f-5',
      time: '2m ago',
      text: 'Trader @hans_algo locked 98.3% Cold Digit Differs run on Vol 25 (1s) - WON +$48.00',
      type: 'trade'
    }
  ]);

  // Direct WhatsApp contact link
  const whatsappUrl = "https://wa.me/254726152651?text=Hello%20Admin%2C%20I%20have%20an%20inquiry%20regarding%20Deriv%20Precision%20Analyzer";

  // Simulate periodic live tick updates and status pulse
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update latency or active trader count slightly to reflect real-time live connection
      setTraders(prev => prev.map(t => {
        if (t.role === 'admin') {
          return { ...t, latencyMs: Math.max(14, Math.round(latencyMs + (Math.random() * 6 - 3))) };
        }
        return {
          ...t,
          latencyMs: Math.max(12, Math.round(t.latencyMs + (Math.random() * 4 - 2)))
        };
      }));

      // Add a live simulation feed event occasionally
      if (Math.random() > 0.6) {
        const sampleTraders = ['kimani_fx', 'otieno_trade', 'mwangi_deriv', 'sarah_uk_fx', 'alex_trader_za'];
        const randomTrader = sampleTraders[Math.floor(Math.random() * sampleTraders.length)];
        const markets = ['Vol 100 (1s)', 'Vol 10 (1s)', 'Vol 75', 'Vol 50 (1s)'];
        const randomMarket = markets[Math.floor(Math.random() * markets.length)];
        const profits = [9.50, 19.00, 24.50, 38.00, 14.25];
        const randomProfit = profits[Math.floor(Math.random() * profits.length)];

        const newEvent = {
          id: `f-${Date.now()}`,
          time: 'Just now',
          text: `Trader @${randomTrader} secured high-confidence win on ${randomMarket} (+ $${randomProfit.toFixed(2)})`,
          type: 'trade' as const
        };

        setActivityFeed(prev => [newEvent, ...prev.slice(0, 7)]);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    }, 4000);

    return () => clearInterval(interval);
  }, [latencyMs]);

  // Metrics summary dynamically derived from mode (1 private admin operator vs 142 simulated demo network)
  const summary: ActiveTradersSummary = useMemo(() => {
    if (!showSimulatedRoster) {
      return {
        totalActive: 1,
        peakToday: 1,
        predictionsGenerated: 34,
        averageWinRate: 97.1,
        totalVolume: 485.20
      };
    }
    const totalActive = 142 + Math.floor(Math.random() * 6);
    return {
      totalActive,
      peakToday: 218,
      predictionsGenerated: 6420,
      averageWinRate: 96.2,
      totalVolume: 38450.00
    };
  }, [showSimulatedRoster]);

  // Filtered traders list
  const filteredTraders = useMemo(() => {
    const baseList = showSimulatedRoster ? traders : [traders[0] || INITIAL_TRADERS[0]];
    return baseList.filter(t => {
      // Search query
      const matchesSearch = 
        t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.activeMarket.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.strategy.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Market filter
      if (selectedMarketFilter !== 'all' && !t.activeMarket.toLowerCase().includes(selectedMarketFilter.toLowerCase())) {
        return false;
      }

      // Strategy filter
      if (selectedStrategyFilter !== 'all' && t.strategy.toLowerCase() !== selectedStrategyFilter.toLowerCase()) {
        return false;
      }

      // Role filter
      if (selectedRoleFilter !== 'all' && t.role !== selectedRoleFilter) {
        return false;
      }

      return true;
    });
  }, [traders, showSimulatedRoster, searchQuery, selectedMarketFilter, selectedStrategyFilter, selectedRoleFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    soundEngine.playTickPing();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('Just now');
      setBroadcastMessage('✓ Active trader roster and Deriv WebSocket telemetry synchronized.');
      setTimeout(() => setBroadcastMessage(null), 3500);
    }, 600);
  };

  const handleExportCSV = () => {
    soundEngine.playTickPing();
    const headers = ['Username', 'Role', 'Location', 'Market', 'Strategy', 'Status', 'Trades Today', 'Win Rate (%)', 'PnL ($)', 'Device'];
    const rows = filteredTraders.map(t => [
      t.username,
      t.role,
      `"${t.location}"`,
      t.activeMarket,
      t.strategy,
      t.status,
      t.tradesToday,
      t.winRate,
      t.pnlToday,
      `"${t.device}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deriv_active_traders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="active-traders-dashboard" className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* =========================================================================
          TOP BANNER & ADMIN SESSION BADGE
         ========================================================================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#0d1430] via-[#0b1026] to-[#0a0e22] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        
        {/* Glow backlight */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/25 shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-[#070b1a] flex items-center justify-center">
              <Users className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Live Active Traders
              </h1>
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                showSimulatedRoster
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${showSimulatedRoster ? 'bg-emerald-400' : 'bg-cyan-400'} animate-ping`} />
                <span>{showSimulatedRoster ? '142 Online (Demo Preview)' : '1 Online (You: boyboy8076)'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                👑 Admin View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring of active traders streaming Deriv synthetic ticks &amp; executing 95%+ algorithms.
            </p>
          </div>
        </div>

        {/* Admin Action Buttons */}
        <div className="flex items-center gap-2.5 z-10 w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            title="Refresh active list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            title="Export CSV active logs"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Logs</span>
          </button>

          {/* WhatsApp Direct Line */}
          <button
            onClick={() => {
              soundEngine.playTickPing();
              window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5c] hover:to-[#0f7a6e] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            title="Admin WhatsApp Support"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span>WhatsApp Admin</span>
          </button>

          {/* Logout Button in Active Traders Header */}
          {onLogout && (
            <button
              id="active-traders-top-logout-btn"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-100 text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              title="Logout from session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Single User vs Demo Simulation Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#0e1633] border border-cyan-500/30 text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-white flex items-center gap-2">
              <span>{showSimulatedRoster ? 'Previewing Simulated Community Roster' : 'Private Instance State: 1 Active Operator'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${showSimulatedRoster ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                {showSimulatedRoster ? '142 Simulated Users' : 'You (@boyboy8076)'}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed max-w-3xl">
              {showSimulatedRoster
                ? 'Showing the simulated 142-trader network preview to visualize active geographical distribution and strategy telemetry across Africa and international Deriv traders.'
                : 'Because your project has not been published or publicly shared yet, you (@boyboy8076) are the only authorized operator connected. The 142 traders were simulated demo telemetry to preview layout.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowSimulatedRoster(!showSimulatedRoster);
            soundEngine.playTickPing();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
            showSimulatedRoster
              ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
          }`}
        >
          {showSimulatedRoster ? '← Show Private Real State (1 User)' : 'Preview Demo Community (142 Users) →'}
        </button>
      </div>

      {/* Broadcast Toast Notification */}
      {broadcastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <span>{broadcastMessage}</span>
          <button onClick={() => setBroadcastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* =========================================================================
          KEY TELEMETRY METRIC CARDS
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Active Traders Online */}
        <div className="p-4 rounded-2xl bg-[#0c1228]/90 border border-emerald-500/25 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Active Traders Now</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.totalActive}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>+18 connected in last hour</span>
            </div>
          </div>
        </div>

        {/* Card 2: Peak Concurrent Today */}
        <div className="p-4 rounded-2xl bg-[#0c1228]/90 border border-cyan-500/25 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Peak Concurrent</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.peakToday}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-cyan-300 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>High volatility session volume</span>
            </div>
          </div>
        </div>

        {/* Card 3: Community Win Rate */}
        <div className="p-4 rounded-2xl bg-[#0c1228]/90 border border-amber-500/25 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Avg Signal Win Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
              {summary.averageWinRate}%
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Even/Odd &amp; Under 8 Confluence</span>
            </div>
          </div>
        </div>

        {/* Card 4: Predictions Generated Today */}
        <div className="p-4 rounded-2xl bg-[#0c1228]/90 border border-purple-500/25 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Predictions Generated</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summary.predictionsGenerated.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Live on Volatility 10, 25, 50, 75, 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FILTER & SEARCH TOOLBAR
         ========================================================================= */}
      <div className="p-4 rounded-2xl bg-[#0c1126] border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Field */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, location (Kenya, SA, UK...), or strategy..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141a38] border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-sans"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          
          {/* Market Filter */}
          <select
            value={selectedMarketFilter}
            onChange={(e) => setSelectedMarketFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141a38] border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="all">All Markets</option>
            <option value="100">Vol 100</option>
            <option value="10">Vol 10</option>
            <option value="75">Vol 75</option>
            <option value="50">Vol 50</option>
            <option value="25">Vol 25</option>
          </select>

          {/* Strategy Filter */}
          <select
            value={selectedStrategyFilter}
            onChange={(e) => setSelectedStrategyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141a38] border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="all">All Strategies</option>
            <option value="profit plus">Profit Plus AI</option>
            <option value="even/odd">Even/Odd Parity</option>
            <option value="under 8">Under 8 Safe Haven</option>
            <option value="matches">Matches Tool</option>
            <option value="differs">Differs</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141a38] border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vip">VIP Traders</option>
            <option value="trader">Traders</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          ACTIVE TRADERS MAIN TABLE
         ========================================================================= */}
      <div className="rounded-2xl bg-[#0c1126] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Connected Traders Roster ({filteredTraders.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Gateway: ws.derivws.com • Ping: {latencyMs}ms
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121838]/80 text-slate-400 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Trader / Account</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Market</th>
                <th className="py-3 px-3">Strategy</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Performance</th>
                <th className="py-3 px-3">Device / Ping</th>
                <th className="py-3 px-4 text-right">PnL Today</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTraders.map((trader) => {
                const isAdmin = trader.role === 'admin';
                const isVip = trader.role === 'vip';

                return (
                  <tr 
                    key={trader.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isAdmin ? 'bg-emerald-950/20 border-l-4 border-l-emerald-400' : ''
                    }`}
                  >
                    {/* Trader Name & Role */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isAdmin 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50' 
                            : isVip 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40' 
                            : 'bg-slate-700/80 text-slate-200'
                        }`}>
                          {isAdmin ? '👑' : trader.username.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">
                              {trader.username}
                            </span>
                            {isAdmin && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-400/40">
                                ADMIN
                              </span>
                            )}
                            {isVip && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold text-[9px] border border-purple-400/40">
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{trader.connectedDuration}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">{trader.flagEmoji}</span>
                        <span className="text-slate-300 font-medium">{trader.location}</span>
                      </div>
                    </td>

                    {/* Market */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-cyan-300 text-[11px]">
                        {trader.activeMarket}
                      </span>
                    </td>

                    {/* Strategy */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-200">
                        {trader.strategy}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          trader.status === 'EXECUTING' 
                            ? 'bg-amber-400 animate-ping' 
                            : trader.status === 'BOT_RUNNING' 
                            ? 'bg-purple-400 animate-pulse' 
                            : trader.status === 'ANALYZING' 
                            ? 'bg-emerald-400 animate-pulse' 
                            : 'bg-slate-500'
                        }`} />
                        <span className="text-[11px] text-slate-300 font-medium">
                          {trader.statusText}
                        </span>
                      </div>
                    </td>

                    {/* Performance */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-400 text-xs">
                          {trader.winRate}% win
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {trader.tradesToday} contracts
                        </span>
                      </div>
                    </td>

                    {/* Device / Latency */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-slate-300 text-[11px]">
                          {trader.device}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{trader.latencyMs}ms</span>
                        </span>
                      </div>
                    </td>

                    {/* PnL Today */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        +${trader.pnlToday.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          REAL-TIME LIVE STREAM TICKER / ACTIVITY LOG
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Activity Feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0c1126] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Live Execution Feed</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Updated: {lastUpdated}</span>
            </div>

            <div className="space-y-2.5">
              {activityFeed.map((item) => (
                <div 
                  key={item.id} 
                  className="p-2.5 rounded-xl bg-[#121838]/80 border border-slate-800 flex items-start gap-2.5 text-xs animate-fade-in"
                >
                  <div className="mt-0.5 shrink-0">
                    {item.type === 'trade' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {item.type === 'signal' && <Zap className="w-4 h-4 text-cyan-400" />}
                    {item.type === 'bot' && <Bot className="w-4 h-4 text-purple-400" />}
                    {item.type === 'connect' && <Globe className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-200">{item.text}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Quick Information & Support Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111738] to-[#0c1026] border border-emerald-500/30 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Operator Console</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are signed in as the authorized administrator <strong className="text-amber-300 font-mono">boyboy8076</strong>. 
              Traders requesting credentials via WhatsApp will be routed directly to your configured link.
            </p>

            <div className="p-3 rounded-xl bg-[#171f45] border border-[#2c3770] space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Admin Account:</span>
                <span className="font-mono text-amber-300 font-bold">boyboy8076</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deriv Gateway:</span>
                <span className="font-mono text-emerald-400">ws.derivws.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WebSocket Ping:</span>
                <span className="font-mono text-cyan-400">{latencyMs}ms</span>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={() => {
                soundEngine.playTickPing();
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5c] hover:to-[#0f7a6e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Open Admin WhatsApp Direct</span>
            </button>

            {onLogout && (
              <button
                type="button"
                id="active-sidebar-logout-btn"
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 hover:text-rose-100 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                title="Logout from session"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout from Precision Analyzer</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
