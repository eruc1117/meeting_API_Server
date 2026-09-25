const StockService = require('../../services/StockService');

describe('StockService.isAllowed（唯讀白名單）', () => {
  it.each([
    '/health',
    '/stocks',
    '/stocks/industries',
    '/stocks/2330',
    '/stocks/2330/prices',
    '/stocks/0050/institutional',
    '/forecast/weekly',
    '/forecast/weekly/status',
    '/catalog',
    '/predictions/2330',
    '/voting/results',
  ])('allows %s', (p) => {
    expect(StockService.isAllowed(p)).toBe(true);
  });

  it.each([
    '/holdings',                 // 每人一份，不透過行事曆帳號轉發
    '/holdings/trades',
    '/auth/users',               // 帳號管理
    '/auth/login',
    '/crawler/run',              // 管理端點
    '/models/freeze',
    '/data/backfill',
    '/stocks/../auth/users',     // 路徑穿越
    'stocks',                    // 沒有前導斜線
    '/stocks/2330/prices/extra',
    '',
    null,
  ])('rejects %s', (p) => {
    expect(StockService.isAllowed(p)).toBe(false);
  });
});

describe('StockService.proxyGet', () => {
  const realFetch = global.fetch;
  const env = { ...process.env };

  beforeEach(() => {
    StockService.resetTokenCache();
    process.env.STOCK_API_USER = 'svc';
    process.env.STOCK_API_PASSWORD = 'pw';
  });
  afterEach(() => {
    global.fetch = realFetch;
    process.env = { ...env };
  });

  it('returns E403_STOCK_PATH for a non-whitelisted path without calling upstream', async () => {
    global.fetch = jest.fn();
    const r = await StockService.proxyGet('/holdings');
    expect(r.error.code).toBe('E403_STOCK_PATH');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('logs in once, then forwards with Bearer and returns data', async () => {
    const calls = [];
    global.fetch = jest.fn(async (url, opts = {}) => {
      calls.push({ url, opts });
      if (String(url).endsWith('/auth/login')) {
        return { ok: true, status: 200, json: async () => ({ token: 'T1' }) };
      }
      return { ok: true, status: 200, json: async () => ([{ stock_id: '2330' }]) };
    });
    const r = await StockService.proxyGet('/stocks', { tracked: 'true' });
    expect(r.data).toEqual([{ stock_id: '2330' }]);
    expect(calls[0].url).toMatch(/\/auth\/login$/);
    expect(calls[1].url).toMatch(/\/stocks\?tracked=true$/);
    expect(calls[1].opts.headers.Authorization).toBe('Bearer T1');

    // 第二次不再登入（token 快取）
    await StockService.proxyGet('/stocks');
    expect(calls.filter((c) => String(c.url).endsWith('/auth/login')).length).toBe(1);
  });

  it('re-logins once when upstream answers 401', async () => {
    let logins = 0;
    let tries = 0;
    global.fetch = jest.fn(async (url) => {
      if (String(url).endsWith('/auth/login')) {
        logins += 1;
        return { ok: true, status: 200, json: async () => ({ token: `T${logins}` }) };
      }
      tries += 1;
      if (tries === 1) return { ok: false, status: 401, json: async () => ({ detail: 'expired' }) };
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    });
    const r = await StockService.proxyGet('/health');
    expect(r.data).toEqual({ ok: true });
    expect(logins).toBe(2);
  });

  it('maps upstream failure to E502_STOCK_UPSTREAM', async () => {
    global.fetch = jest.fn(async (url) => {
      if (String(url).endsWith('/auth/login')) return { ok: true, status: 200, json: async () => ({ token: 'T' }) };
      return { ok: false, status: 503, json: async () => ({ detail: '爬蟲服務未啟動' }) };
    });
    const r = await StockService.proxyGet('/forecast/weekly');
    expect(r.error.code).toBe('E502_STOCK_UPSTREAM');
    expect(r.error.message).toBe('爬蟲服務未啟動');
  });
});
