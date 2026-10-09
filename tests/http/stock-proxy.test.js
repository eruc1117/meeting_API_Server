// /api/stock/* 代理 — http 層。上游用 tests/helpers/stock-upstream.js 在隨機埠起的假 erucMoney
//（StockService 用 Node 內建 fetch，nock 13 攔不到，所以用真的 HTTP 伺服器）。
const request = require('supertest');
const { startStockUpstream } = require('../helpers/stock-upstream');
const { userToken } = require('../helpers/tokens');

let app, upstream;
const tok = userToken(42, 'proxyuser');

beforeAll(async () => {
  upstream = await startStockUpstream();   // 會把 process.env.STOCK_API_URL 指到假上游
  app = require('../../app');
});
afterAll(async () => { await upstream.close(); });
beforeEach(() => { upstream.calls.length = 0; });

describe('/api/stock 代理', () => {
  it('未登入：分析類 GET 匿名轉發（不帶 Authorization）；個人資料與寫入 401（Iteration 52）', async () => {
    const res = await request(app).get('/api/stock/stocks');
    expect(res.statusCode).toBe(200);
    expect(upstream.calls[0]).toEqual(expect.objectContaining({ method: 'GET', path: '/stocks' }));
    expect(upstream.calls[0].auth || '').toBe('');
    upstream.calls.length = 0;
    expect((await request(app).get('/api/stock/holdings')).statusCode).toBe(401);
    expect((await request(app).post('/api/stock/holdings/trades').send({ stock_id: '2330' })).statusCode).toBe(401);
    expect((await request(app).get('/api/stock/crawler/status/2330')).statusCode).toBe(401);
    expect(upstream.calls).toHaveLength(0);
  });

  it('GET 帶 Bearer 原樣轉，query 保留，回 {data}', async () => {
    const res = await request(app).get('/api/stock/stocks?tracked=true').set('Authorization', `Bearer ${tok}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ data: [{ stock_id: '2330', stock_name: '台積電' }] });
    expect(upstream.calls[0]).toEqual(expect.objectContaining({ method: 'GET', path: '/stocks', query: { tracked: 'true' }, auth: `Bearer ${tok}` }));
  });

  it('POST body 原樣轉，上游 201 → 200 {data}', async () => {
    const body = { stock_id: '2330', side: 'Buy', shares: 10, price: 2405 };
    const res = await request(app).post('/api/stock/holdings/trades').set('Authorization', `Bearer ${tok}`).send(body);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({ ok: true, echo: body });
    expect(upstream.calls[0]).toEqual(expect.objectContaining({ method: 'POST', path: '/holdings/trades', body }));
  });

  it('上游 403（admin 端點）→ 403，message 是上游 detail', async () => {
    const res = await request(app).post('/api/stock/crawler/run').set('Authorization', `Bearer ${tok}`).send({ stock_id: '2330' });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('需要 admin 權限');
    expect(res.body.error.code).toBe('E502_STOCK_UPSTREAM');
    expect(res.body.upstream).toEqual({ detail: '需要 admin 權限' });
  });

  it('上游 404 → 404 保留 detail', async () => {
    const res = await request(app).get('/api/stock/stocks/9999').set('Authorization', `Bearer ${tok}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('股票 9999 資料不足');
  });

  it('上游 503 → 502 E502_STOCK_UPSTREAM', async () => {
    const res = await request(app).get('/api/stock/forecast/weekly').set('Authorization', `Bearer ${tok}`);
    expect(res.statusCode).toBe(502);
    expect(res.body.error.code).toBe('E502_STOCK_UPSTREAM');
    expect(res.body.message).toBe('爬蟲服務未啟動');
  });

  it('被擋的路徑 /auth/login → 403 E403_STOCK_PATH，不打上游', async () => {
    const res = await request(app).post('/api/stock/auth/login').set('Authorization', `Bearer ${tok}`).send({});
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('E403_STOCK_PATH');
    expect(upstream.calls).toHaveLength(0);
  });

  it('不在允許清單的第一段 → 403', async () => {
    const res = await request(app).get('/api/stock/unknown/thing').set('Authorization', `Bearer ${tok}`);
    expect(res.statusCode).toBe(403);
  });

  it('/health：上游在線回 {online:true, upstream}', async () => {
    const res = await request(app).get('/api/stock/health').set('Authorization', `Bearer ${tok}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({ online: true, upstream: { ok: true, time: '2026-01-01T00:00:00.000Z' } });
  });

  it('/health：上游離線回 502 與 {online:false}', async () => {
    const saved = process.env.STOCK_API_URL;
    process.env.STOCK_API_URL = 'http://127.0.0.1:1';   // 沒人在聽的埠
    const res = await request(app).get('/api/stock/health').set('Authorization', `Bearer ${tok}`);
    process.env.STOCK_API_URL = saved;
    expect(res.statusCode).toBe(502);
    expect(res.body.data).toEqual({ online: false });
    expect(res.body.error.code).toBe('E502_STOCK_UPSTREAM');
  });

  it('上游逾時 → 502「股票服務逾時」（STOCK_API_TIMEOUT_MS=2000）', async () => {
    const res = await request(app).get('/api/stock/stocks/SLOW').set('Authorization', `Bearer ${tok}`);
    expect(res.statusCode).toBe(502);
    expect(res.body.message).toBe('股票服務逾時');
  });

  it('壞 token → 401（authMiddleware 先擋）', async () => {
    const res = await request(app).get('/api/stock/stocks').set('Authorization', 'Bearer not-a-token');
    expect(res.statusCode).toBe(401);
    expect(upstream.calls).toHaveLength(0);
  });
});
