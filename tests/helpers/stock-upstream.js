// 測試用的假股票 API（erucMoney）：StockService 用 Node 內建 fetch（undici），nock 13 攔不到，
// 所以直接在隨機埠起一個 express，並把 STOCK_API_URL 指過去（StockService 每次呼叫都重讀環境變數）。
const express = require('express');

function startStockUpstream() {
  const app = express();
  app.use(express.json());
  const calls = [];
  app.use((req, _res, next) => { calls.push({ method: req.method, path: req.path, query: req.query, body: req.body, auth: req.headers.authorization }); next(); });

  app.get('/health', (_req, res) => res.json({ ok: true, time: '2026-01-01T00:00:00.000Z' }));
  app.get('/stocks', (_req, res) => res.json([{ stock_id: '2330', stock_name: '台積電' }]));
  app.post('/holdings/trades', (req, res) => res.status(201).json({ ok: true, echo: req.body }));
  app.post('/crawler/run', (_req, res) => res.status(403).json({ detail: '需要 admin 權限' }));
  app.get('/forecast/weekly', (_req, res) => res.status(503).json({ detail: '爬蟲服務未啟動' }));
  app.get('/stocks/9999', (_req, res) => res.status(404).json({ detail: '股票 9999 資料不足' }));
  app.get('/stocks/SLOW', (_req, res) => setTimeout(() => res.json({ ok: true }), 5000));   // 逾時測試用
  app.get('/auth/me', (_req, res) => res.json({ id: 1, username: 'u', role: 'user' }));

  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}`;
      process.env.STOCK_API_URL = url;
      resolve({ url, calls, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

module.exports = { startStockUpstream };
