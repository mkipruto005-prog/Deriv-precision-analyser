export interface DerivOAuthAccount {
  account: string;
  token: string;
  currency: string;
  isVirtual: boolean;
}

export interface ExtractedCredentials {
  type: 'accounts_list' | 'single_token' | 'invalid';
  accounts?: DerivOAuthAccount[];
  primaryToken?: string;
  appId?: string;
  message?: string;
}

export interface TokenVerificationResult {
  isValid: boolean;
  loginid?: string;
  currency?: string;
  balance?: number;
  isVirtual?: boolean;
  email?: string;
  scopes?: string[];
  accountList?: Array<{
    loginid: string;
    isVirtual: boolean;
    currency: string;
    category?: string;
  }>;
  errorCode?: string;
  errorMessage?: string;
  latencyMs?: number;
}

/**
 * Normalizes any query or hash string into a standard URLSearchParams instance
 */
function toURLSearchParams(rawInput: string): URLSearchParams {
  let str = (rawInput || '').trim();
  // Strip outer quotes if pasted
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  
  // If input contains ?, take whatever comes after the first ?
  if (str.includes('?')) {
    str = str.split('?')[1];
  }
  // If input contains #, check if params are after #
  if (str.includes('#')) {
    const afterHash = str.split('#')[1];
    str = afterHash.includes('?') ? afterHash.split('?')[1] : afterHash;
  }

  // Remove trailing slashes or fragments
  str = str.replace(/[#&]+$/, '');

  return new URLSearchParams(str);
}

/**
 * Parses query parameters from Deriv OAuth redirect (acct1, token1, cur1, acct2, token2, cur2, ...)
 * Handles full URLs (https://oauth.deriv.com/redirect?acct1=...), hash fragments, or query strings.
 */
export function parseDerivOAuthParams(rawInput: string): DerivOAuthAccount[] {
  if (!rawInput) return [];
  const params = toURLSearchParams(rawInput);
  const accounts: DerivOAuthAccount[] = [];
  
  // Check indexed parameters acct1, token1, cur1 up to index 20
  for (let i = 1; i <= 20; i++) {
    const hasToken = params.has(`token${i}`);
    const hasAcct = params.has(`acct${i}`);
    
    if (hasToken) {
      const token = (params.get(`token${i}`) || '').trim();
      const account = (params.get(`acct${i}`) || `ACCOUNT_${i}`).trim();
      const currency = (params.get(`cur${i}`) || 'USD').toUpperCase().trim();
      const isVirtual = account.toUpperCase().startsWith('VRTC') || account.toUpperCase().startsWith('VRT');

      if (token) {
        accounts.push({
          account,
          token,
          currency,
          isVirtual
        });
      }
    } else if (hasAcct && !hasToken) {
      // If there's an acct but no token with that index, continue checking
      continue;
    }
  }

  // If acct1 wasn't indexed with 1, check unindexed ?acct=...&token=... or ?token1=...
  if (accounts.length === 0 && (params.has('token') || params.has('token1'))) {
    const token = (params.get('token') || params.get('token1') || '').trim();
    const account = (params.get('acct') || params.get('acct1') || params.get('account') || params.get('loginid') || '').trim();
    const currency = (params.get('cur') || params.get('cur1') || params.get('currency') || 'USD').toUpperCase().trim();
    if (token) {
      accounts.push({
        account: account || 'DERIV_USER',
        token,
        currency,
        isVirtual: account.toUpperCase().startsWith('VRTC') || account.toUpperCase().startsWith('VRT')
      });
    }
  }

  return accounts;
}

/**
 * Intelligent credential extractor that handles:
 * 1. Full OAuth redirect URL (e.g. https://oauth.deriv.com/redirect?acct1=...&token1=...)
 * 2. URL query string (?acct1=... or acct1=...)
 * 3. Raw tokens with spaces or quotes
 * 4. Token prefixes (Bearer ..., Token: ..., pat_...)
 * 5. JSON strings {"token": "..."}
 */
export function extractDerivCredentials(rawInput: string): ExtractedCredentials {
  if (!rawInput || !rawInput.trim()) {
    return { type: 'invalid', message: 'Input is empty' };
  }

  let text = rawInput.trim();

  // Strip outer quotes
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }

  // Check if it's JSON
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.token || parsed.api_token || parsed.apiToken) {
        const token = (parsed.token || parsed.api_token || parsed.apiToken).trim();
        return {
          type: 'single_token',
          primaryToken: token,
          appId: parsed.app_id || parsed.appId
        };
      }
    } catch {}
  }

  // Check if it contains OAuth parameters (acct1 and token1 or ?token1)
  if (text.includes('token1') || text.includes('acct1')) {
    const accounts = parseDerivOAuthParams(text);
    if (accounts.length > 0) {
      // Check if URL also specified app_id
      const params = toURLSearchParams(text);
      const extractedAppId = params.get('app_id') || params.get('appId') || undefined;
      return {
        type: 'accounts_list',
        accounts,
        primaryToken: accounts[0].token,
        appId: extractedAppId,
        message: `Extracted ${accounts.length} Deriv accounts (${accounts.map(a => a.account).join(', ')})`
      };
    }
  }

  // Check for common key-value formats: token=... or token1=...
  if (text.includes('=') && !text.includes(' ')) {
    const params = toURLSearchParams(text);
    const token = params.get('token') || params.get('token1') || params.get('api_token');
    if (token) {
      return {
        type: 'single_token',
        primaryToken: token.trim(),
        appId: params.get('app_id') || undefined
      };
    }
  }

  // Strip common prefix wrappers
  let cleaned = text;
  cleaned = cleaned.replace(/^(bearer|token|api_token|api token)[:\s]+/i, '').trim();
  cleaned = cleaned.replace(/;.*$/, '').trim(); // remove any trailing semicolon

  // Detect if user pasted an Account Login ID (CR... or VRTC...) instead of an API token
  if (/^(CR|VRTC|VRT|MF|MLT)\d+$/i.test(cleaned)) {
    return {
      type: 'invalid',
      message: `You entered your Deriv Account Login ID (${cleaned.toUpperCase()}). Deriv requires an API Token to connect without asking for your password. Please generate a token at app.deriv.com/account/api-token.`
    };
  }

  // Detect email address
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return {
      type: 'invalid',
      message: 'You entered an email address. Deriv requires an API Token to securely link your account without exposing your password.'
    };
  }

  // If token is alphanumeric or starts with pat_ or has hyphenated structure
  if (cleaned.length >= 8 && cleaned.length <= 128) {
    return {
      type: 'single_token',
      primaryToken: cleaned
    };
  }

  return {
    type: 'invalid',
    message: 'Could not recognize a valid Deriv token or OAuth URL'
  };
}

/**
 * Generates the official Deriv OAuth authorization URL
 */
export function getDerivOAuthUrl(appId: string = '1089'): string {
  const cleanAppId = (appId || '').trim() || '1089';
  return `https://oauth.deriv.com/oauth2/authorize?app_id=${cleanAppId}&l=en`;
}

/**
 * Gateways tested during real-time token verification (in order of reliability)
 */
const VERIFICATION_GATEWAYS = [
  'wss://ws.derivws.com/websockets/v3',
  'wss://frontend.derivws.com/websockets/v3',
  'wss://ws.binaryws.com/websockets/v3',
  'wss://blue.derivws.com/websockets/v3'
];

/**
 * Verifies a Deriv API token in real-time by initiating an ephemeral TLS WebSocket connection
 * with multi-gateway failover and sending { authorize: token }.
 */
export async function verifyDerivToken(token: string, appId: string = '1089'): Promise<TokenVerificationResult> {
  const cleanToken = (token || '').trim();
  const cleanAppId = (appId || '').trim() || '1089';

  if (!cleanToken) {
    return {
      isValid: false,
      errorCode: 'EmptyToken',
      errorMessage: 'Token cannot be blank'
    };
  }

  // Check if user entered an account ID
  if (/^(CR|VRTC|VRT|MF|MLT)\d+$/i.test(cleanToken)) {
    return {
      isValid: false,
      errorCode: 'IsAccountLoginId',
      errorMessage: `"${cleanToken.toUpperCase()}" is your Deriv Account Login ID, not an API Token. Deriv requires an API Token generated from app.deriv.com/account/api-token.`
    };
  }

  // Check if user entered an email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanToken)) {
    return {
      isValid: false,
      errorCode: 'IsEmail',
      errorMessage: 'Deriv requires an API Token rather than an email to securely connect your trading terminal.'
    };
  }

  for (const gateway of VERIFICATION_GATEWAYS) {
    const res = await attemptGatewayVerify(gateway, cleanToken, cleanAppId);
    // If we received an explicit authorize response (valid or invalid token), return immediately
    if (res.errorCode !== 'WebSocketError' && res.errorCode !== 'Timeout' && res.errorCode !== 'InitError') {
      return res;
    }
  }

  // If all gateways were unreachable
  return {
    isValid: false,
    errorCode: 'NetworkError',
    errorMessage: 'Could not establish connection to Deriv API servers. Please check your internet connection or VPN.'
  };
}

function attemptGatewayVerify(gatewayUrl: string, token: string, appId: string): Promise<TokenVerificationResult> {
  return new Promise((resolve) => {
    let ws: WebSocket | null = null;
    let isSettled = false;
    const startTime = Date.now();

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          ws?.close();
        } catch {}
        resolve({
          isValid: false,
          errorCode: 'Timeout',
          errorMessage: 'Connection timed out'
        });
      }
    }, 2800);

    const cleanup = () => {
      clearTimeout(timer);
      try {
        ws?.close();
      } catch {}
    };

    try {
      const url = `${gatewayUrl}?app_id=${appId}&l=en`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        try {
          ws?.send(JSON.stringify({ authorize: token }));
        } catch {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            resolve({
              isValid: false,
              errorCode: 'SendFailed',
              errorMessage: 'Failed to send payload to Deriv gateway'
            });
          }
        }
      };

      ws.onmessage = (event) => {
        if (isSettled) return;
        try {
          const data = JSON.parse(event.data);
          const latencyMs = Date.now() - startTime;

          // If token is already authorized, treat as valid
          if (data.error?.code === 'AlreadyAuthorized') {
            isSettled = true;
            cleanup();
            resolve({
              isValid: true,
              loginid: 'ACTIVE_DERIV_SESSION',
              latencyMs
            });
            return;
          }

          if (data.msg_type === 'authorize') {
            if (data.error) {
              isSettled = true;
              cleanup();
              const errCode = data.error.code || 'AuthorizeError';
              const errMsg = data.error.message || 'Deriv rejected token';
              resolve({
                isValid: false,
                errorCode: errCode,
                errorMessage: errCode === 'InvalidToken'
                  ? 'Deriv reported: Invalid Token. Please verify that your token is active, copied completely, and has Read & Trade scopes enabled.'
                  : errMsg,
                latencyMs
              });
              return;
            }

            if (data.authorize) {
              isSettled = true;
              cleanup();
              const auth = data.authorize;
              const accountList = Array.isArray(auth.account_list)
                ? auth.account_list.map((a: any) => ({
                    loginid: a.loginid,
                    isVirtual: a.is_virtual === 1,
                    currency: a.currency || 'USD',
                    category: a.account_category
                  }))
                : [];

              resolve({
                isValid: true,
                loginid: auth.loginid,
                currency: auth.currency || 'USD',
                balance: typeof auth.balance === 'number' ? auth.balance : 0,
                isVirtual: auth.is_virtual === 1,
                email: auth.email,
                scopes: Array.isArray(auth.scopes) ? auth.scopes : [],
                accountList,
                latencyMs
              });
              return;
            }
          }

          if (data.error) {
            isSettled = true;
            cleanup();
            resolve({
              isValid: false,
              errorCode: data.error.code || 'ApiError',
              errorMessage: data.error.message || 'Deriv error',
              latencyMs
            });
          }
        } catch (e: any) {
          if (!isSettled) {
            isSettled = true;
            cleanup();
            resolve({
              isValid: false,
              errorCode: 'ParseError',
              errorMessage: e.message
            });
          }
        }
      };

      ws.onerror = () => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve({
            isValid: false,
            errorCode: 'WebSocketError',
            errorMessage: 'Gateway connection failed'
          });
        }
      };
    } catch {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        resolve({
          isValid: false,
          errorCode: 'InitError',
          errorMessage: 'Init failed'
        });
      }
    }
  });
}

/**
 * Storage helpers for local session persistence
 */
const STORAGE_TOKEN_KEY = 'deriv_api_token';
const STORAGE_APP_ID_KEY = 'deriv_app_id';
const STORAGE_ACCOUNTS_KEY = 'deriv_oauth_accounts';

export function getStoredApiToken(): string {
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiToken(token: string) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token.trim());
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  } catch {}
}

export function getStoredAppId(): string {
  try {
    return localStorage.getItem(STORAGE_APP_ID_KEY) || '1089';
  } catch {
    return '1089';
  }
}

export function setStoredAppId(appId: string) {
  try {
    localStorage.setItem(STORAGE_APP_ID_KEY, appId.trim() || '1089');
  } catch {}
}

export function getStoredOAuthAccounts(): DerivOAuthAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoredOAuthAccounts(accounts: DerivOAuthAccount[]) {
  try {
    if (accounts && accounts.length > 0) {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    } else {
      localStorage.removeItem(STORAGE_ACCOUNTS_KEY);
    }
  } catch {}
}
