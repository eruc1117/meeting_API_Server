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
    '/holdings',
    '/holdings/trades',
    '/holdings/review',
    '/auth/me',
  ])('allows %s', (p) => {
    expect(StockService.isAllowed(p)).toBe(true);
  });

  it.each([
    '/auth/users',               // 帳號管理
    '/auth/login',
    '/auth/change-password',
    '/holdings/trades/estimate/x',
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

describe('StockService.proxyGet（轉送使用者自己的 token）', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it('returns E403_STOCK_PATH for a non-whitelisted path without calling upstream', async () => {
    global.fetch = jest.fn();
    const r = await StockService.proxyGet('/auth/users', {}, 'T');
    expect(r.error.code).toBe('E403_STOCK_PATH');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns E004_UNAUTHORIZED when no token is given', async () => {
    global.fetch = jest.fn();
    const r = await StockService.proxyGet('/stocks', {}, '');
    expect(r.error.code).toBe('E004_UNAUTHORIZED');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('forwards GET with the caller Bearer and returns data', async () => {
    const calls = [];
    global.fetch = jest.fn(async (url, opts = {}) => {
      calls.push({ url, opts });
      return { ok: true, status: 200, json: async () => ([{ stock_id: '2330' }]) };
    });
    const r = await StockService.proxyGet('/stocks', { tracked: 'true' }, 'USER_TOKEN');
    expect(r.data).toEqual([{ stock_id: '2330' }]);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/stocks\?tracked=true$/);
    expect(calls[0].opts.headers.Authorization).toBe('Bearer USER_TOKEN');
  });

  it('maps upstream 401 to E502_STOCK_AUTH (secret mismatch)', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({ detail: '登入憑證無效' }) }));
    const r = await StockService.proxyGet('/holdings', {}, 'T');
    expect(r.error.code).toBe('E502_STOCK_AUTH');
  });

  it('maps upstream failure to E502_STOCK_UPSTREAM with the upstream detail', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({ detail: '爬蟲服務未啟動' }) }));
    const r = await StockService.proxyGet('/forecast/weekly', {}, 'T');
    expect(r.error.code).toBe('E502_STOCK_UPSTREAM');
    expect(r.error.message).toBe('爬蟲服務未啟動');
  });
});
