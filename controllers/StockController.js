/**
 * StockController — /api/stock/*（唯讀，需登入）
 *
 * GET /api/stock/health            上游股票服務是否在線
 * GET /api/stock/<任何白名單路徑>   轉發到 erucMoney API，例如
 *     /api/stock/stocks?tracked=true
 *     /api/stock/stocks/2330/prices?days=90
 *     /api/stock/forecast/weekly
 * 回應格式沿用本專案：成功 { data }，失敗 { message, error: { code } }。
 */
const StockService = require('../services/StockService');

const STATUS_BY_CODE = {
  E403_STOCK_PATH: 403,
  E503_STOCK_NOT_CONFIGURED: 503,
  E502_STOCK_AUTH: 502,
  E502_STOCK_UPSTREAM: 502,
};

async function proxy(req, res) {
  // req.baseUrl = /api/stock，req.path = 其後的路徑（Express 5 的萬用路由用 req.path）
  const upstreamPath = req.path === '/' ? '' : req.path;
  const result = await StockService.proxyGet(upstreamPath, req.query);
  if (result.error) {
    const status = result.error.status === 404 ? 404 : (STATUS_BY_CODE[result.error.code] || 502);
    return res.status(status).json({ message: result.error.message, error: { code: result.error.code } });
  }
  return res.status(200).json({ data: result.data });
}

async function health(req, res) {
  const result = await StockService.proxyGet('/health');
  if (result.error) {
    return res.status(STATUS_BY_CODE[result.error.code] || 502)
      .json({ message: result.error.message, error: { code: result.error.code }, data: { online: false } });
  }
  return res.json({ data: { online: true, upstream: result.data } });
}

module.exports = { proxy, health };
