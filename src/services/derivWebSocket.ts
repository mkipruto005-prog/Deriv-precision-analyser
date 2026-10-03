import { TickData, DerivSymbol, DerivAccountInfo } from '../types';
import { extractLastDigit } from './technicalAnalysis';
import { DERIV_SYMBOLS } from '../constants/symbols';

const SYMBOL_PIP_MAP = new Map<string, number>(DERIV_SYMBOLS.map((s) => [s.id, s.pipSize]));

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FALLBACK';

export interface DerivTelemetry {
  isRealDeriv: boolean;
  gateway: string;
  realTickCount: number;
  lastServerTime?: number;
  reconnectAttempts: number;
}

export interface RealContractResult {
  contractId: number | string;
  signalId?: string;
  transactionId?: number | string;
  symbol: string;
  contractType: string;
  buyPrice: number;
  payout: number;
  profit: number;
  isWin: boolean;
  exitTick?: number;
  exitDigit?: number;
  status: 'won' | 'lost';
}

interface DerivWsHandlers {
  onTick: (tick: TickData) => void;
  onHistory: (ticks: TickData[]) => void;
  onStatusChange: (status: ConnectionStatus, latencyMs: number, telemetry?: DerivTelemetry) => void;
  onAccountUpdate?: (account: DerivAccountInfo) => void;
  onError?: (err: string) => void;
  onMultiSymbolTick?: (symbolId: string, tick: TickData) => void;
  onMultiSymbolHistory?: (symbolId: string, historyTicks: TickData[]) => void;
  onContractBought?: (data: { contractId: number | string; buyPrice: number; payout: number; shortcode?: string }) => void;
  onContractSettled?: (result: RealContractResult) => void;
}

const OFFICIAL_DERIV_GATEWAYS = [
  'wss://ws.derivws.com/websockets/v3',
  'wss://ws.binaryws.com/websockets/v3',
  'wss://blue.derivws.com/websockets/v3'
];

export class DerivWebSocketClient {
  private ws: WebSocket | null = null;
  private currentSymbol: DerivSymbol | null = null;
  private handlers: DerivWsHandlers;
  private appId: string = '1089'; // Official Deriv default public app id
  private apiToken: string = '';
  private accountInfo: DerivAccountInfo | null = null;
  private pingInterval: number | null = null;
  private lastPingTime: number = 0;
  private latencyMs: number = 24;
  private isIntentionalClose: boolean = false;
  private fallbackInterval: number | null = null;
  private fallbackPrice: number = 1000;
  private status: ConnectionStatus = 'DISCONNECTED';
  private contractToSignalMap: Map<string, string> = new Map();
  private rejectedTokens: Set<string> = new Set();
  private hasReportedAuthError: boolean = false;
  private gatewayIndex: number = 0;
  private reconnectTimer: number | null = null;
  private reconnectAttempts: number = 0;
  private realTickCount: number = 0;
  private lastServerTime: number = 0;
  private isRealDeriv: boolean = false;
  private subscribedSymbols: Set<string> = new Set();

  constructor(handlers: DerivWsHandlers) {
    this.handlers = handlers;
  }

  public setAppConfig(appId?: string, apiToken?: string) {
    const oldAppId = this.appId;
    const oldToken = this.apiToken;
    if (appId && appId.trim()) this.appId = appId.trim();
    if (apiToken !== undefined) {
      const cleanToken = apiToken.trim();
      if (cleanToken !== oldToken) {
        this.apiToken = cleanToken;
        this.rejectedTokens.delete(cleanToken);
        this.hasReportedAuthError = false;
      }
    }

    // If appId changed and we have an active connection, reconnect with new app_id URL
    if (appId && appId.trim() !== oldAppId && this.currentSymbol) {
      this.connect(this.currentSymbol);
    }
  }

  public authorize(token: string) {
    this.apiToken = token.trim();
    this.rejectedTokens.delete(this.apiToken);
    this.hasReportedAuthError = false;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ authorize: this.apiToken }));
    } else if (this.currentSymbol) {
      this.connect(this.currentSymbol);
    }
  }

  public logout() {
    this.apiToken = '';
    this.rejectedTokens.clear();
    this.hasReportedAuthError = false;
    this.accountInfo = { isAuthorized: false };
    if (this.handlers.onAccountUpdate) {
      this.handlers.onAccountUpdate(this.accountInfo);
    }
    if (this.currentSymbol) {
      this.connect(this.currentSymbol);
    }
  }

  public connect(symbol: DerivSymbol) {
    this.currentSymbol = symbol;
    this.isIntentionalClose = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    // Only attempt the REST options API if the user provided a token AND a custom App ID (not public 1089)
    // Because Deriv's REST options endpoint rejects app_id 1089 with HTTP 401 Invalid application.
    if (
      this.apiToken &&
      this.apiToken.startsWith('pat_') &&
      this.appId !== '1089' &&
      !this.rejectedTokens.has(this.apiToken)
    ) {
      this.connectWithPat(symbol, this.apiToken, this.appId);
      return;
    }

    const gateway = OFFICIAL_DERIV_GATEWAYS[this.gatewayIndex] || 'wss://ws.derivws.com/websockets/v3';
    const url = `${gateway}?app_id=${this.appId}&l=en`;
    this.openWebSocket(url, symbol, false);
  }

  public reconnect() {
    this.isIntentionalClose = false;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.currentSymbol) {
      this.connect(this.currentSymbol);
    }
  }

  private scheduleReconnect() {
    if (this.isIntentionalClose) return;
    if (this.reconnectTimer) return;

    this.isRealDeriv = false;
    this.reconnectAttempts++;

    // Rotate through official Deriv gateways after failures
    if (this.reconnectAttempts % 2 === 0) {
      this.gatewayIndex = (this.gatewayIndex + 1) % OFFICIAL_DERIV_GATEWAYS.length;
    }

    // Bridge with high-fidelity local ticks during momentary reconnect so UI doesn't freeze
    if (!this.fallbackInterval) {
      this.startFallback();
    } else {
      this.updateStatus('FALLBACK', 15);
    }

    const delay = Math.min(1200 + this.reconnectAttempts * 600, 4500);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isIntentionalClose && this.currentSymbol) {
        const gateway = OFFICIAL_DERIV_GATEWAYS[this.gatewayIndex] || 'wss://ws.derivws.com/websockets/v3';
        const url = `${gateway}?app_id=${this.appId}&l=en`;
        this.openWebSocket(url, this.currentSymbol, false);
      }
    }, delay);
  }

  private openWebSocket(url: string, symbol: DerivSymbol, isAuthorizedViaOtp: boolean = false) {
    if (!this.fallbackInterval) {
      this.updateStatus('CONNECTING', 0);
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.reconnectAttempts = 0;
        this.isRealDeriv = true;
        this.stopFallback();
        this.updateStatus('CONNECTED', 25);
        this.startPing();
        this.subscribedSymbols.clear();

        // Immediate initial ping to measure real round-trip latency to Deriv servers
        this.lastPingTime = Date.now();
        try {
          this.ws?.send(JSON.stringify({ ping: 1 }));
        } catch {}

        // If not authorized via OTP and user provided a token that wasn't already rejected, authorize via WS
        if (!isAuthorizedViaOtp && this.apiToken && !this.rejectedTokens.has(this.apiToken)) {
          this.ws?.send(JSON.stringify({ authorize: this.apiToken }));
        }

        // Subscribe to ticks for active symbol
        this.subscribeSymbol(symbol);
        // Request tick history and live subscriptions for all volatility markets
        this.requestAllVolatilityTicks();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.warn('Deriv message parse error', e);
        }
      };

      this.ws.onerror = () => {
        console.warn('Deriv WS connection issue, re-establishing real Deriv socket stream...');
        this.scheduleReconnect();
      };

      this.ws.onclose = () => {
        if (!this.isIntentionalClose) {
          console.warn('Deriv WS closed, re-establishing real Deriv socket stream...');
          this.scheduleReconnect();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private async connectWithPat(symbol: DerivSymbol, pat: string, appId: string) {
    this.updateStatus('CONNECTING', 0);
    const cleanAppId = appId.trim() || '1089';

    try {
      // Step 1: Query accounts via Deriv REST API
      const accountsRes = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Deriv-App-ID': cleanAppId,
          'Accept': 'application/json'
        }
      });

      if (!accountsRes.ok) {
        let errorText = await accountsRes.text();
        try {
          const errJson = JSON.parse(errorText);
          errorText = errJson.message || errJson.errors?.[0]?.message || errorText;
        } catch {}

        this.accountInfo = { isAuthorized: false };
        if (this.handlers.onAccountUpdate) {
          this.handlers.onAccountUpdate(this.accountInfo);
        }

        // If REST API rejected the app_id/token (e.g. 401 Invalid application),
        // fallback to standard Deriv WebSocket v3 connection which allows direct authorization
        const fallbackUrl = `wss://ws.derivws.com/websockets/v3?app_id=${cleanAppId}`;
        this.openWebSocket(fallbackUrl, symbol, false);
        return;
      }

      const accountsData = await accountsRes.json();
      let accounts: any[] = [];
      if (Array.isArray(accountsData)) {
        accounts = accountsData;
      } else if (Array.isArray(accountsData.data)) {
        accounts = accountsData.data;
      } else if (Array.isArray(accountsData.accounts)) {
        accounts = accountsData.accounts;
      }

      if (accounts.length === 0) {
        if (this.handlers.onError) {
          this.handlers.onError('No trading accounts found for this Deriv PAT token. Please verify your account setup on Deriv.');
        }
        const fallbackUrl = `wss://ws.derivws.com/websockets/v3?app_id=${cleanAppId}`;
        this.openWebSocket(fallbackUrl, symbol, false);
        return;
      }

      // Prefer demo account or first account
      const selectedAccount = accounts.find((a: any) => a.type === 'demo' || String(a.id || a.account_id).startsWith('VRTC')) || accounts[0];
      const accountId = selectedAccount.id || selectedAccount.account_id || selectedAccount.accountId;

      // Step 2: Request short-lived single-use OTP for WebSocket authentication
      const otpRes = await fetch(`https://api.derivws.com/trading/v1/options/accounts/${accountId}/otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Deriv-App-ID': cleanAppId,
          'Content-Type': 'application/json'
        }
      });

      if (!otpRes.ok) {
        let otpErr = await otpRes.text();
        try {
          const otpErrJson = JSON.parse(otpErr);
          otpErr = otpErrJson.message || otpErrJson.errors?.[0]?.message || otpErr;
        } catch {}
        if (this.handlers.onError) {
          this.handlers.onError(`Deriv OTP Error: ${otpErr}. Could not generate authenticated trading connection.`);
        }
        const fallbackUrl = `wss://ws.derivws.com/websockets/v3?app_id=${cleanAppId}`;
        this.openWebSocket(fallbackUrl, symbol, false);
        return;
      }

      const otpData = await otpRes.json();
      const wsUrl = otpData.ws_url || `wss://api.derivws.com/trading/v1/options/ws/${selectedAccount.type === 'real' ? 'real' : 'demo'}?otp=${otpData.otp}`;

      // Mark account authorized
      this.accountInfo = {
        isAuthorized: true,
        loginid: String(accountId),
        currency: selectedAccount.currency || 'USD',
        balance: typeof selectedAccount.balance === 'number' ? selectedAccount.balance : (selectedAccount.total_cash ?? 10000),
        isVirtual: selectedAccount.type === 'demo' || String(accountId).startsWith('VRTC'),
        email: selectedAccount.email
      };
      if (this.handlers.onAccountUpdate) {
        this.handlers.onAccountUpdate(this.accountInfo);
      }

      // Connect to the authenticated WebSocket URL
      this.openWebSocket(wsUrl, symbol, true);
    } catch (err: any) {
      console.warn('PAT connection error:', err);
      if (this.handlers.onError) {
        this.handlers.onError(`PAT Connection Error: ${err?.message || 'Network error connecting to Deriv API'}`);
      }
      const fallbackUrl = `wss://ws.derivws.com/websockets/v3?app_id=${cleanAppId}`;
      this.openWebSocket(fallbackUrl, symbol, false);
    }
  }

  public changeSymbol(newSymbol: DerivSymbol) {
    this.currentSymbol = newSymbol;
    if (this.fallbackInterval) {
      this.fallbackPrice = getInitialPrice(newSymbol);
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Subscribe to history and live tick stream for the new active market
      this.subscribeSymbol(newSymbol);
      // Ensure all scanner background markets remain actively monitored without dropping subscriptions
      this.subscribeOtherVolatilityMarkets();
    } else {
      this.connect(newSymbol);
    }
  }

  public getTelemetry(): DerivTelemetry {
    return {
      isRealDeriv: this.isRealDeriv && this.status === 'CONNECTED',
      gateway: OFFICIAL_DERIV_GATEWAYS[this.gatewayIndex] || 'wss://ws.derivws.com/websockets/v3',
      realTickCount: this.realTickCount,
      lastServerTime: this.lastServerTime || Math.floor(Date.now() / 1000),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  private subscribeSymbol(symbol: DerivSymbol) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Request tick history and subscribe to live ticks according to Deriv v3 specification
    const req = {
      ticks_history: symbol.id,
      count: 150,
      end: 'latest',
      style: 'ticks',
      subscribe: 1
    };

    this.ws.send(JSON.stringify(req));
  }

  private handleMessage(data: Record<string, any>) {
    // Error response
    if (data.error) {
      const errMsg = data.error.message || 'Deriv API error';
      console.warn('Deriv API response error:', errMsg);

      // Check if authorization failed
      if (data.msg_type === 'authorize' || data.error.code === 'InvalidToken' || data.error.code === 'AuthorizationRequired') {
        this.accountInfo = { isAuthorized: false };
        if (this.apiToken) {
          this.rejectedTokens.add(this.apiToken);
        }
        if (this.handlers.onAccountUpdate) {
          this.handlers.onAccountUpdate({ isAuthorized: false });
        }
        if (this.handlers.onError && !this.hasReportedAuthError) {
          this.hasReportedAuthError = true;
          this.handlers.onError(`Deriv Auth Notice: Token rejected (${errMsg}). Real trades paused; simulation running.`);
        }
        return;
      }

      // Non-critical background scanner or forgotten tick errors should not trigger user-facing alerts
      const isSymbolError = data.error.code === 'InvalidSymbol' || errMsg.toLowerCase().includes('symbol') || errMsg.toLowerCase().includes('is invalid');
      const isCurrentActiveSymbol = this.currentSymbol && errMsg.includes(this.currentSymbol.id);

      // If it's a background market scanner symbol that Deriv rejected, silently ignore it
      if (isSymbolError && !isCurrentActiveSymbol) {
        return;
      }

      if (this.handlers.onError) {
        this.handlers.onError(errMsg);
      }
      return;
    }

    // Ping response
    if (data.msg_type === 'ping') {
      const roundTrip = Math.max(8, Date.now() - this.lastPingTime);
      this.latencyMs = roundTrip;
      this.updateStatus('CONNECTED', roundTrip);
      return;
    }

    // Authorize response
    if (data.msg_type === 'authorize') {
      if (data.authorize) {
        this.accountInfo = {
          isAuthorized: true,
          loginid: data.authorize.loginid,
          currency: data.authorize.currency,
          balance: data.authorize.balance,
          isVirtual: data.authorize.is_virtual === 1
        };
        if (this.handlers.onAccountUpdate) {
          this.handlers.onAccountUpdate(this.accountInfo);
        }
        // Subscribe to live balance updates
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        }
      }
      return;
    }

    // Live balance update
    if (data.msg_type === 'balance' && data.balance) {
      if (this.accountInfo) {
        this.accountInfo.balance = data.balance.balance;
        this.accountInfo.currency = data.balance.currency;
        if (this.handlers.onAccountUpdate) {
          this.handlers.onAccountUpdate({ ...this.accountInfo });
        }
      }
      return;
    }

    // Contract purchase response
    if (data.msg_type === 'buy' && data.buy) {
      const contractId = data.buy.contract_id;
      const signalId = data.passthrough?.signalId;
      if (contractId && signalId) {
        this.contractToSignalMap.set(String(contractId), signalId);
      }
      if (this.handlers.onContractBought) {
        this.handlers.onContractBought({
          contractId,
          buyPrice: data.buy.buy_price,
          payout: data.buy.payout,
          shortcode: data.buy.shortcode
        });
      }
      // Subscribe to live proposal open contract tracking for this contract
      if (contractId && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ proposal_open_contract: 1, contract_id: contractId, subscribe: 1 }));
      }
      return;
    }

    // Proposal open contract response (live contract settlement)
    if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract) {
      const poc = data.proposal_open_contract;
      if (poc.is_sold === 1) {
        const isWin = poc.status === 'won';
        const profit = poc.profit !== undefined ? poc.profit : (isWin ? (poc.payout - poc.buy_price) : -poc.buy_price);
        const exitDigit = poc.exit_tick ? extractLastDigit(parseFloat(poc.exit_tick), this.currentSymbol?.pipSize || 2) : undefined;
        const mappedSignalId = this.contractToSignalMap.get(String(poc.contract_id));
        this.contractToSignalMap.delete(String(poc.contract_id));

        if (this.handlers.onContractSettled) {
          this.handlers.onContractSettled({
            contractId: poc.contract_id,
            signalId: mappedSignalId,
            transactionId: poc.transaction_ids?.buy,
            symbol: poc.underlying || this.currentSymbol?.id || 'R_100',
            contractType: poc.contract_type || 'DIGITUNDER',
            buyPrice: poc.buy_price,
            payout: poc.payout,
            profit: parseFloat(profit.toFixed(2)),
            isWin,
            exitTick: poc.exit_tick ? parseFloat(poc.exit_tick) : undefined,
            exitDigit,
            status: isWin ? 'won' : 'lost'
          });
        }
      }
      return;
    }

    // Tick history response
    if (data.msg_type === 'history' && data.history) {
      this.isRealDeriv = true;
      this.stopFallback();

      const prices: number[] = data.history.prices || [];
      const times: number[] = data.history.times || [];
      const reqSymbol = data.echo_req?.ticks_history || this.currentSymbol?.id || 'R_100';
      const exactPipSize = SYMBOL_PIP_MAP.get(reqSymbol) ?? this.currentSymbol?.pipSize ?? 2;
      const symbolId = reqSymbol;

      this.realTickCount += prices.length;
      if (times.length > 0) {
        this.lastServerTime = times[times.length - 1];
      }

      const ticks: TickData[] = prices.map((price, idx) => ({
        epoch: times[idx] || Math.floor(Date.now() / 1000) - (prices.length - idx),
        quote: price,
        symbol: symbolId,
        pipSize: exactPipSize,
        lastDigit: extractLastDigit(price, exactPipSize)
      }));

      if (this.currentSymbol && symbolId === this.currentSymbol.id) {
        this.handlers.onHistory(ticks);
      }
      if (this.handlers.onMultiSymbolHistory) {
        this.handlers.onMultiSymbolHistory(symbolId, ticks);
      }
      this.updateStatus('CONNECTED', this.latencyMs);
      return;
    }

    // Live tick
    if (data.msg_type === 'tick' && data.tick) {
      this.isRealDeriv = true;
      this.stopFallback();
      this.realTickCount++;

      const quote = data.tick.quote;
      const symbolId = data.tick.symbol ?? this.currentSymbol?.id ?? 'R_100';
      const exactPipSize = SYMBOL_PIP_MAP.get(symbolId) ?? data.tick.pip_size ?? (this.currentSymbol?.id === symbolId ? this.currentSymbol.pipSize : 2);

      if (data.tick.epoch) {
        this.lastServerTime = data.tick.epoch;
      }

      const tick: TickData = {
        epoch: data.tick.epoch || Math.floor(Date.now() / 1000),
        quote,
        symbol: symbolId,
        pipSize: exactPipSize,
        lastDigit: extractLastDigit(quote, exactPipSize)
      };

      if (this.currentSymbol && symbolId === this.currentSymbol.id) {
        this.handlers.onTick(tick);
      }
      if (this.handlers.onMultiSymbolTick) {
        this.handlers.onMultiSymbolTick(symbolId, tick);
      }

      // Periodically update connection status telemetry
      if (this.realTickCount % 5 === 0) {
        this.updateStatus('CONNECTED', this.latencyMs);
      }
    }
  }

  public requestAllVolatilityTicks() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const scannerSymbols = [
      '1HZ100V', '1HZ90V', '1HZ75V', '1HZ50V', '1HZ30V', '1HZ25V', '1HZ15V', '1HZ10V',
      'R_100', 'R_75', 'R_50', 'R_25', 'R_10'
    ];
    scannerSymbols.forEach((symId, idx) => {
      window.setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({
              ticks_history: symId,
              count: 60,
              end: 'latest',
              style: 'ticks'
            }));
          } catch {}
        }
      }, idx * 45);
    });
  }

  private subscribeOtherVolatilityMarkets() {
    this.requestAllVolatilityTicks();
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.ws.send(JSON.stringify({ ping: 1 }));
      }
    }, 15000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private updateStatus(status: ConnectionStatus, latency: number) {
    this.status = status;
    const currentGateway = OFFICIAL_DERIV_GATEWAYS[this.gatewayIndex] || 'wss://ws.derivws.com/websockets/v3';
    this.handlers.onStatusChange(status, latency, {
      isRealDeriv: this.isRealDeriv && status === 'CONNECTED',
      gateway: currentGateway,
      realTickCount: this.realTickCount,
      lastServerTime: this.lastServerTime || Math.floor(Date.now() / 1000),
      reconnectAttempts: this.reconnectAttempts
    });
  }

  /**
   * High-Fidelity Simulation Fallback:
   * Generates realistic synthetic index Brownian motion with correct volatility,
   * decimal pip sizing, and digit distributions so user can test seamlessly.
   */
  private startFallback() {
    this.stopFallback();
    this.stopPing();
    this.updateStatus('FALLBACK', 12);

    const symbol = this.currentSymbol || {
      id: 'R_100',
      name: 'Volatility 100 Index',
      category: 'volatility',
      pipSize: 2,
      description: ''
    };

    this.fallbackPrice = this.getInitialPrice(symbol);
    const pipSize = symbol.pipSize;

    // Generate initial 120 historical ticks
    const history: TickData[] = [];
    let cur = this.fallbackPrice;
    const now = Math.floor(Date.now() / 1000);

    for (let i = 120; i >= 0; i--) {
      cur = this.generateNextStep(cur, symbol);
      history.push({
        epoch: now - i * 2,
        quote: parseFloat(cur.toFixed(pipSize)),
        symbol: symbol.id,
        pipSize,
        lastDigit: extractLastDigit(cur, pipSize)
      });
    }

    this.handlers.onHistory(history);

    // Continuous tick stream (1s interval for 1s indices, 2s for normal)
    const intervalMs = symbol.category === 'volatility_1s' ? 1000 : 1500;

    const backgroundVolPrices: Record<string, { price: number; pipSize: number }> = {
      R_10: { price: 4978.91, pipSize: 3 },
      R_25: { price: 2637.96, pipSize: 3 },
      R_50: { price: 89.557, pipSize: 4 },
      R_75: { price: 43565.47, pipSize: 4 },
      R_100: { price: 578.77, pipSize: 2 },
      '1HZ10V': { price: 9470.33, pipSize: 2 },
      '1HZ15V': { price: 13584.39, pipSize: 3 },
      '1HZ25V': { price: 907598.26, pipSize: 2 },
      '1HZ30V': { price: 6023.87, pipSize: 3 },
      '1HZ50V': { price: 223453.22, pipSize: 2 },
      '1HZ75V': { price: 5784.31, pipSize: 2 },
      '1HZ90V': { price: 17610.92, pipSize: 3 },
      '1HZ100V': { price: 869.88, pipSize: 2 }
    };

    // Emit initial histories for background markets in fallback mode
    if (this.handlers.onMultiSymbolHistory) {
      for (const [symId, data] of Object.entries(backgroundVolPrices)) {
        if (symId !== symbol.id) {
          const symTicks: TickData[] = [];
          let p = data.price;
          for (let k = 60; k >= 0; k--) {
            p = this.generateNextStep(p, {
              id: symId,
              pipSize: data.pipSize,
              category: symId.startsWith('1HZ') ? 'volatility_1s' : 'volatility',
              name: symId,
              description: ''
            });
            const q = parseFloat(p.toFixed(data.pipSize));
            symTicks.push({
              epoch: now - k * 2,
              quote: q,
              symbol: symId,
              pipSize: data.pipSize,
              lastDigit: extractLastDigit(q, data.pipSize)
            });
          }
          this.handlers.onMultiSymbolHistory(symId, symTicks);
        }
      }
    }

    this.fallbackInterval = window.setInterval(() => {
      this.fallbackPrice = this.generateNextStep(this.fallbackPrice, symbol);
      const quote = parseFloat(this.fallbackPrice.toFixed(pipSize));

      const tick: TickData = {
        epoch: Math.floor(Date.now() / 1000),
        quote,
        symbol: symbol.id,
        pipSize,
        lastDigit: extractLastDigit(quote, pipSize)
      };

      this.handlers.onTick(tick);

      // Also emit ticks for other volatility indices for continuous live scanner coverage
      if (this.handlers.onMultiSymbolTick) {
        const now = Math.floor(Date.now() / 1000);
        for (const [symId, data] of Object.entries(backgroundVolPrices)) {
          if (symId !== symbol.id) {
            data.price = this.generateNextStep(data.price, {
              id: symId,
              pipSize: data.pipSize,
              category: symId.startsWith('1HZ') ? 'volatility_1s' : 'volatility',
              name: symId,
              description: ''
            });
            const subQuote = parseFloat(data.price.toFixed(data.pipSize));
            this.handlers.onMultiSymbolTick(symId, {
              epoch: now,
              quote: subQuote,
              symbol: symId,
              pipSize: data.pipSize,
              lastDigit: extractLastDigit(subQuote, data.pipSize)
            });
          }
        }
      }
    }, intervalMs);
  }

  private stopFallback() {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  private getInitialPrice(symbol: DerivSymbol): number {
    return getInitialPrice(symbol);
  }

  private generateNextStep(prev: number, symbol: DerivSymbol): number {
    return generateNextStep(prev, symbol);
  }

  public buyContract(params: {
    amount: number;
    symbol: string;
    contractType: string;
    barrier?: number | string;
    duration?: number;
    durationUnit?: string;
    currency?: string;
    signalId?: string;
  }): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (this.handlers.onError) {
        this.handlers.onError('Deriv WebSocket is currently not connected.');
      }
      return false;
    }
    if (!this.apiToken) {
      if (this.handlers.onError) {
        this.handlers.onError('Deriv API token is required to execute trades on your Deriv account.');
      }
      return false;
    }

    const payload: Record<string, any> = {
      buy: 1,
      price: params.amount,
      passthrough: {
        signalId: params.signalId,
        stake: params.amount
      },
      parameters: {
        amount: params.amount,
        basis: 'stake',
        contract_type: params.contractType,
        currency: params.currency || this.accountInfo?.currency || 'USD',
        duration: params.duration || 1,
        duration_unit: params.durationUnit || 't',
        symbol: params.symbol
      }
    };

    if (params.barrier !== undefined) {
      payload.parameters.barrier = String(params.barrier);
    }

    try {
      this.ws.send(JSON.stringify(payload));
      return true;
    } catch (err: any) {
      if (this.handlers.onError) {
        this.handlers.onError(err?.message || 'Failed to send contract order to Deriv');
      }
      return false;
    }
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();
    this.stopFallback();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.isRealDeriv = false;
    this.updateStatus('DISCONNECTED', 0);
  }
}

export function getInitialPrice(symbol: DerivSymbol): number {
  switch (symbol.id) {
    case 'R_100': return 1520.45;
    case 'R_75': return 328450.82;
    case 'R_50': return 254.182;
    case 'R_25': return 1845.21;
    case 'R_10': return 6245.12;
    case '1HZ100V': return 2341.55;
    case '1HZ90V': return 1980.60;
    case '1HZ75V': return 5620.10;
    case '1HZ50V': return 310.45;
    case '1HZ30V': return 3410.80;
    case '1HZ25V': return 785.45;
    case '1HZ15V': return 2840.15;
    case '1HZ10V': return 4120.30;
    default: return 1000.00;
  }
}

export function generateNextStep(prev: number, symbol: DerivSymbol): number {
  const pipSize = symbol.pipSize || 2;
  const minStep = Math.pow(10, -pipSize);
  const volatilityMultiplier = symbol.category === 'volatility' || symbol.category === 'volatility_1s' ? 0.8 : 0.0002;
  const stdDev = Math.max(minStep * 10, prev * 0.0004 * volatilityMultiplier);
  const u1 = Math.random() || 0.0001;
  const u2 = Math.random() || 0.0001;
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Micro noise ensures full-resolution digit variance across all decimal places up to pipSize
  const microNoise = (Math.random() - 0.5) * minStep * 8;
  return Math.max(minStep, prev + z * stdDev + microNoise);
}

export function generateInitialTicks(symbol: DerivSymbol, count = 120): TickData[] {
  let cur = getInitialPrice(symbol);
  const pipSize = symbol.pipSize || 2;
  const now = Math.floor(Date.now() / 1000);
  const ticks: TickData[] = [];

  for (let i = count; i >= 0; i--) {
    cur = generateNextStep(cur, symbol);
    const quote = parseFloat(cur.toFixed(pipSize));
    ticks.push({
      epoch: now - i * (symbol.category === 'volatility_1s' ? 1 : 2),
      quote,
      symbol: symbol.id,
      pipSize,
      lastDigit: extractLastDigit(quote, pipSize)
    });
  }

  return ticks;
}
