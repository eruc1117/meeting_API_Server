/**
 * StockService — 股票儀表板（erucMoney）的唯讀代理
 *
 * 行事曆平台的使用者登入後，可以在「股票」分頁看到追蹤股票與週預測摘要。
 * 資料來自另一套系統（erucMoney，Node.js :3001 或 https://api.erucmoney.com），
 * 它有自己的帳號與 JWT；這裡用一個服務帳號（STOCK_API_USER / STOCK_API_PASSWORD）
 * 登入取得 token 並快取，再把前端的 GET 請求轉過去。
 *
 * 只轉發白名單內的唯讀端點：行情、產業、週預測、模型目錄、健康檢查。
 * 持股、交易、帳號等每人一份或需要 admin 的端點一律不轉——那些要在 erucMoney 自己的畫面用它的帳號操作。
 */
// 設定在呼叫時才讀（測試會在 require 之後改 process.env）
const cfg = () => ({
  base: (process.env.STOCK_API_URL || 'http://localhost:3001').replace(/\/+$/, ''),
  user: process.env.STOCK_API_USER || '',
  password: process.env.STOCK_API_PASSWORD || '',
  timeoutMs: Number(process.env.STOCK_API_TIMEOUT_MS || 20000),
});

// 唯讀白名單（GET）。path 不含 query string。
const ALLOWED = [
  /^\/health$/,
  /^\/stocks$/,
  /^\/stocks\/industries$/,
  /^\/stocks\/[A-Za-z0-9.]{1,12}$/,
  /^\/stocks\/[A-Za-z0-9.]{1,12}\/(prices|chips|institutional)$/,
  /^\/forecast\/weekly(\/status)?$/,
  /^\/catalog$/,
  /^\/predictions\/[A-Za-z0-9.]{1,12}$/,
  /^\/voting\/results$/,
];

function isAllowed(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('..')) return false;
  return ALLOWED.some((re) => re.test(path));
}

let cached = { token: null, at: 0 };
const TOKEN_TTL_MS = 6 * 24 * 60 * 60 * 1000;   // 上游 token 7 天，提前一天換

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg().timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function login() {
  const { base, user, password } = cfg();
  if (!user || !password) {
    return { error: { code: 'E503_STOCK_NOT_CONFIGURED', message: '尚未設定 STOCK_API_USER / STOCK_API_PASSWORD' } };
  }
  const res = await fetchWithTimeout(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password }),
  });
  if (!res.ok) {
    return { error: { code: 'E502_STOCK_AUTH', message: `股票服務登入失敗（HTTP ${res.status}）` } };
  }
  const data = await res.json();
  cached = { token: data.token, at: Date.now() };
  return { token: data.token };
}

async function getToken(force = false) {
  if (!force && cached.token && Date.now() - cached.at < TOKEN_TTL_MS) return { token: cached.token };
  return login();
}

/**
 * 轉發一個 GET。回傳 { status, data } 或 { error }。
 * 上游回 401 時重新登入一次再試（token 被換掉或服務帳號密碼改了）。
 */
async function proxyGet(path, query = {}) {
  if (!isAllowed(path)) {
    return { error: { code: 'E403_STOCK_PATH', message: '不允許的股票端點' } };
  }
  const qs = new URLSearchParams(query).toString();
  const url = `${cfg().base}${path}${qs ? `?${qs}` : ''}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const t = await getToken(attempt > 0);
    if (t.error) return t;
    let res;
    try {
      res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${t.token}` } });
    } catch (err) {
      const timeout = err.name === 'AbortError';
      return { error: { code: 'E502_STOCK_UPSTREAM', message: timeout ? '股票服務逾時' : `股票服務連線失敗：${err.message}` } };
    }
    if (res.status === 401 && attempt === 0) continue;
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    if (!res.ok) {
      return { error: { code: 'E502_STOCK_UPSTREAM', message: (body && body.detail) || `股票服務回應 HTTP ${res.status}`, status: res.status } };
    }
    return { status: res.status, data: body };
  }
  return { error: { code: 'E502_STOCK_AUTH', message: '股票服務登入失敗' } };
}

function resetTokenCache() { cached = { token: null, at: 0 }; }

module.exports = { proxyGet, isAllowed, getToken, resetTokenCache, ALLOWED };
