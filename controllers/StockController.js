/**
 * StockController — /api/stock/*（需登入）
 *
 * GET  /api/stock/health                 上游股票服務是否在線
 * ANY  /api/stock/<上游路徑>?<query>      以使用者自己的 JWT 轉發到 erucMoney API（方法、query、body 原樣轉），例如
 *      GET    /api/stock/stocks?tracked=true
 *      GET    /api/stock/stocks/2330/prices?days=90
 *      POST   /api/stock/holdings/trades          ← 使用者自己的交易台帳（同一套登入）
 *      POST   /api/stock/crawler/run              ← 上游要求 admin；一般使用者會拿到 403
 * 回應格式沿用本專案：成功 { data }，失敗 { message, error: { code }, upstream? }。
 * 上游的 4xx 原樣保留狀態碼（403 沒權限、404 查無資料、409 衝突、422 參數錯），5xx 與連線失敗一律 502。
 */
const StockService = require('../services/StockService');

const STATUS_BY_CODE = {
  E403_STOCK_PATH: 403,
  E004_UNAUTHORIZED: 401,
  E502_STOCK_AUTH: 502,
  E502_STOCK_UPSTREAM: 502,
};

// 長工作：上游會等 FastAPI 做完才回（資料回填、模型評估、爬蟲、週預測）
const LONG_PATHS = [/^\/data\/backfill/, /^\/models\/evaluate/, /^\/crawler\//, /^\/forecast\/weekly\/run$/, /^\/voting\/run$/, /^\/model\/retrain$/];
const LONG_TIMEOUT_MS = Number(process.env.STOCK_API_LONG_TIMEOUT_MS || 180000);

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

function statusFor(error) {
  const s = error.status;
  if (s && s >= 400 && s < 500 && s !== 401) return s;   // 上游的權限／驗證／查無資料原樣回
  return STATUS_BY_CODE[error.code] || 502;
}

async function proxy(req, res) {
  // req.baseUrl = /api/stock，req.path = 其後的路徑（Express 5 的萬用路由用 req.path）
  const upstreamPath = req.path === '/' ? '' : req.path;
  const long = LONG_PATHS.some((re) => re.test(upstreamPath));
  const result = await StockService.proxy({
    method: req.method,
    path: upstreamPath,
    query: req.query,
    token: bearer(req),
    body: req.method === 'GET' ? undefined : req.body,
    timeoutMs: long ? LONG_TIMEOUT_MS : undefined,
  });
  if (result.error) {
    const { upstream, ...error } = result.error;
    return res.status(statusFor(result.error)).json({ message: error.message, error: { code: error.code }, upstream });
  }
  return res.status(200).json({ data: result.data });
}

async function health(req, res) {
  const result = await StockService.proxyGet('/health', {}, bearer(req));
  if (result.error) {
    return res.status(STATUS_BY_CODE[result.error.code] || 502)
      .json({ message: result.error.message, error: { code: result.error.code }, data: { online: false } });
  }
  return res.json({ data: { online: true, upstream: result.data } });
}

module.exports = { proxy, health };
