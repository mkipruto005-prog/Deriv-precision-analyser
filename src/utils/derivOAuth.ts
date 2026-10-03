export interface DerivOAuthAccount {
  account: string;
  token: string;
  currency: string;
  isVirtual: boolean;
}

/**
 * Parses query parameters from Deriv OAuth redirect (acct1, token1, cur1, acct2, token2, cur2, ...)
 */
export function parseDerivOAuthParams(search: string): DerivOAuthAccount[] {
  if (!search) return [];
  const params = new URLSearchParams(search);
  const accounts: DerivOAuthAccount[] = [];
  
  let i = 1;
  while (params.has(`acct${i}`) && params.has(`token${i}`)) {
    const account = params.get(`acct${i}`) || '';
    const token = params.get(`token${i}`) || '';
    const currency = (params.get(`cur${i}`) || 'USD').toUpperCase();
    const isVirtual = account.toUpperCase().startsWith('VRTC') || account.toUpperCase().startsWith('VRT');

    if (account && token) {
      accounts.push({
        account,
        token,
        currency,
        isVirtual
      });
    }
    i++;
  }

  return accounts;
}

/**
 * Generates the official Deriv OAuth authorization URL
 */
export function getDerivOAuthUrl(appId: string = '1089'): string {
  const cleanAppId = appId.trim() || '1089';
  return `https://oauth.deriv.com/oauth2/authorize?app_id=${cleanAppId}&l=en`;
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
