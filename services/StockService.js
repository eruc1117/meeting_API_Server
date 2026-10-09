/**
 * StockService — 股票系統（erucMoney）的代理
 *
 * 登入系統只有一套：行事曆平台簽的 JWT（含 id、username）。erucMoney 的 Node API 用同一把密鑰
 * （它的 JWT_SECRET = 本專案的 SECRET）驗證，第一次看到某個帳號會自動建立對應的使用者。
 * 所以這裡不需要服務帳號，直接把使用者自己的 Bearer 原樣轉過去，上游就知道是誰、持股也是他自己的。
 *
 * Iteration 44 起股票儀表板的全部功能都併進行事曆平台的前端，所以代理不再只轉 GET：
 * GET／POST／PUT／DELETE 與 body 都原樣轉發。授權（一般使用者 vs admin）由上游決定——
 * erucMoney 對 /crawler、/models、/data、/auth/users 要求 admin 角色，這裡不重複判斷。
 *
 * 不轉的只有兩條：/auth/login（登入在行事曆這邊）與 /auth/change-password（SSO 使用者在上游沒有密碼）。
 */
const cfg = () => ({
  base: (process.env.STOCK_API_URL || 'http://localhost:3001').replace(/\/+$/, ''),
  timeoutMs: Number(process.env.STOCK_API_TIMEOUT_MS || 20000),
});

// 允許轉發的上游路徑前綴（第一段）。path 不含 query string。
const ALLOWED_PREFIXES = [
  'health', 'stocks', 'forecast', 'catalog', 'predictions', 'voting', 'holdings',
  'cash', 'gap', 'model', 'models', 'news', 'crawler', 'data', 'us', 'auth',
  'portfolio',   // 月調倉實驗日誌（erucMoney Iteration 51）
  'progress',    // 工作進度（Claude Code harness，上游要求 admin）
];
const DENIED = [/^\/auth\/login$/, /^\/auth\/change-password$/];
// 匿名（沒帶 token）只能 GET 分析類端點；個人資料與所有寫入要登入（Iteration 52，與上游 erucMoney 的 readPublic／requireUser 一致）
const PERSONAL_PREFIXES = ['holdings', 'cash', 'auth', 'crawler', 'models', 'data', 'progress'];

function anonymousAllowed(method, path) {
  if (method !== 'GET') return false;
  const first = String(path || '').split('/')[1] || '';
  return !PERSONAL_PREFIXES.includes(first);
}
const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

function isAllowed(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('..') || path.includes('//')) return false;
  if (DENIED.some((re) => re.test(path))) return false;
  const first = path.split('/')[1] || '';
  return ALLOWED_PREFIXES.includes(first);
}

async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 以使用者自己的 token 轉發一個請求。回傳 { status, data } 或 { error }。
 * @param {object} opts
 * @param {string} opts.method  GET / POST / PUT / DELETE
 * @param {string} opts.path    上游路徑（不含 query）
 * @param {object} opts.query   query 物件
 * @param {string} opts.token   使用者的 JWT（不含 "Bearer "）
 * @param {any}    opts.body    要轉的 JSON body（GET 不帶）
 * @param {number} opts.timeoutMs 覆寫逾時（回填、爬蟲這類長工作）
 */
async function proxy({ method = 'GET', path, query = {}, token = '', body, timeoutMs } = {}) {
  method = String(method || 'GET').toUpperCase();
  if (!METHODS.has(method)) {
    return { error: { code: 'E403_STOCK_PATH', message: `不允許的方法 ${method}` } };
  }
  if (!isAllowed(path)) {
    return { error: { code: 'E403_STOCK_PATH', message: '不允許的股票端點' } };
  }
  if (!token && !anonymousAllowed(method, path)) {
    return { error: { code: 'E004_UNAUTHORIZED', message: '帳號尚未登入' } };
  }
  const qs = new URLSearchParams(query).toString();
  const url = `${cfg().base}${path}${qs ? `?${qs}` : ''}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};   // 匿名讀取不帶 Authorization（上游 readPublic 放行 GET）
  const init = { method, headers };
  if (method !== 'GET' && body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body ?? {});
  }
  let res;
  try {
    res = await fetchWithTimeout(url, init, timeoutMs || cfg().timeoutMs);
  } catch (err) {
    const timeout = err.name === 'AbortError';
    return { error: { code: 'E502_STOCK_UPSTREAM', message: timeout ? '股票服務逾時' : `股票服務連線失敗：${err.message}` } };
  }
  let payload = null;
  try { payload = await res.json(); } catch { payload = null; }
  if (res.status === 401) {
    return { error: { code: 'E502_STOCK_AUTH', message: '股票服務不接受這個登入憑證（兩邊的 JWT 密鑰是否相同？）', status: 401 } };
  }
  if (!res.ok) {
    return { error: { code: 'E502_STOCK_UPSTREAM', message: (payload && payload.detail) || `股票服務回應 HTTP ${res.status}`, status: res.status, upstream: payload } };
  }
  return { status: res.status, data: payload };
}

/** 相容舊呼叫：GET 轉發。 */
const proxyGet = (path, query = {}, token = '') => proxy({ method: 'GET', path, query, token });

module.exports = { proxy, proxyGet, isAllowed, ALLOWED_PREFIXES, DENIED };
