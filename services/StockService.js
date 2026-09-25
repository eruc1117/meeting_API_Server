/**
 * StockService — 股票儀表板（erucMoney）的唯讀代理
 *
 * 登入系統只有一套：行事曆平台簽的 JWT（含 id、username）。erucMoney 的 Node API 用同一把密鑰
 * （它的 JWT_SECRET = 本專案的 SECRET）驗證，第一次看到某個帳號會自動建立對應的使用者。
 * 所以這裡不需要服務帳號，直接把使用者自己的 Bearer 原樣轉過去，上游就知道是誰、持股也是他自己的。
 *
 * 只轉發白名單內的 GET：行情、產業、週預測、模型目錄、健康檢查，以及使用者自己的持股／交易台帳。
 * 帳號管理、爬蟲、模型凍結等管理端點不轉（要在 erucMoney 的畫面用 admin 操作）。
 */
const cfg = () => ({
  base: (process.env.STOCK_API_URL || 'http://localhost:3001').replace(/\/+$/, ''),
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
  /^\/holdings$/,                        // 使用者自己的持股（上游以 token 的身份隔離）
  /^\/holdings\/(trades|review)$/,
  /^\/auth\/me$/,
];

function isAllowed(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('..')) return false;
  return ALLOWED.some((re) => re.test(path));
}

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg().timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 以使用者自己的 token 轉發一個 GET。回傳 { status, data } 或 { error }。
 * @param {string} path   上游路徑（不含 query）
 * @param {object} query  query 物件
 * @param {string} token  使用者的 JWT（不含 "Bearer "）
 */
async function proxyGet(path, query = {}, token = '') {
  if (!isAllowed(path)) {
    return { error: { code: 'E403_STOCK_PATH', message: '不允許的股票端點' } };
  }
  if (!token) {
    return { error: { code: 'E004_UNAUTHORIZED', message: '帳號尚未登入', status: 401 } };
  }
  const qs = new URLSearchParams(query).toString();
  const url = `${cfg().base}${path}${qs ? `?${qs}` : ''}`;
  let res;
  try {
    res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
    const timeout = err.name === 'AbortError';
    return { error: { code: 'E502_STOCK_UPSTREAM', message: timeout ? '股票服務逾時' : `股票服務連線失敗：${err.message}` } };
  }
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (res.status === 401) {
    return { error: { code: 'E502_STOCK_AUTH', message: '股票服務不接受這個登入憑證（兩邊的 JWT 密鑰是否相同？）', status: 401 } };
  }
  if (!res.ok) {
    return { error: { code: 'E502_STOCK_UPSTREAM', message: (body && body.detail) || `股票服務回應 HTTP ${res.status}`, status: res.status } };
  }
  return { status: res.status, data: body };
}

module.exports = { proxyGet, isAllowed, ALLOWED };
