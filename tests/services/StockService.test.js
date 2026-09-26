const StockService = require('../../services/StockService');

describe('StockService.isAllowed（允許的上游路徑）', () => {
  it.each([
    '/health',
    '/stocks',
    '/stocks/industries',
    '/stocks/2330',
    '/stocks/2330/prices',
    '/stocks/0050/institutional',
    '/forecast/weekly',
    '/forecast/weekly/status',
    '/forecast/weekly/run',
    '/catalog',
    '/predictions',
    '/predictions/2330',
    '/predictions/12/compare',
    '/voting',
    '/voting/results',
    '/voting/run',
    '/voting/roles',
    '/holdings',
    '/holdings/trades',
    '/holdings/trades/estimate',
    '/holdings/review',
    '/cash/plan',
    '/gap/predict',
    '/model/predict',
    '/models',
    '/models/lstm/freeze',
    '/news',
    '/news/3',
    '/crawler/run',          // 上游要求 admin，這裡照轉
    '/data/backfill',
    '/us/overview',
    '/auth/me',
    '/auth/users',           // 上游要求 admin
    '/auth/users/3',
  ])('allows %s', (p) => {
    expect(StockService.isAllowed(p)).toBe(true);
  });

  it.each([
    '/auth/login',           // 登入在行事曆
    '/auth/change-password', // SSO 使用者上游沒有密碼
    '/stocks/../auth/users', // 路徑穿越
    '/stocks//industries',
    'stocks',                // 沒有前導斜線
    '/unknown',
    '/',
    '',
    null,
  ])('rejects %s', (p) => {
    expect(StockService.isAllowed(p)).toBe(false);
  });
});

describe('StockService.proxy（轉送使用者自己的 token、方法與 body）', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it('returns E403_STOCK_PATH for a denied path without calling upstream', async () => {
    global.fetch = jest.fn();
    const r = await StockService.proxy({ method: 'POST', path: '/auth/login', token: 'T', body: {} });
    expect(r.error.code).toBe('E403_STOCK_PATH');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects unsupported methods', async () => {
    global.fetch = jest.fn();
    const r = await StockService.proxy({ method: 'TRACE', path: '/stocks', token: 'T' });
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
    expect(calls[0].opts.method).toBe('GET');
    expect(calls[0].opts.headers.Authorization).toBe('Bearer USER_TOKEN');
    expect(calls[0].opts.body).toBeUndefined();
  });

  it('forwards POST with a JSON body', async () => {
    const calls = [];
    global.fetch = jest.fn(async (url, opts = {}) => {
      calls.push({ url, opts });
      return { ok: true, status: 201, json: async () => ({ id: 9 }) };
    });
    const r = await StockService.proxy({ method: 'post', path: '/holdings/trades', token: 'T',
      body: { stock_id: '2330', side: 'Buy', shares: 10, price: 2405 } });
    expect(r.status).toBe(201);
    expect(r.data).toEqual({ id: 9 });
    expect(calls[0].opts.method).toBe('POST');
    expect(calls[0].opts.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(calls[0].opts.body)).toEqual({ stock_id: '2330', side: 'Buy', shares: 10, price: 2405 });
  });

  it('forwards DELETE without a body', async () => {
    const calls = [];
    global.fetch = jest.fn(async (url, opts = {}) => { calls.push({ url, opts }); return { ok: true, status: 200, json: async () => ({ ok: true }) }; });
    await StockService.proxy({ method: 'DELETE', path: '/news/3', token: 'T' });
    expect(calls[0].opts.method).toBe('DELETE');
    expect(calls[0].opts.body).toBeUndefined();
  });

  it('maps upstream 401 to E502_STOCK_AUTH (secret mismatch)', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({ detail: '登入憑證無效' }) }));
    const r = await StockService.proxyGet('/holdings', {}, 'T');
    expect(r.error.code).toBe('E502_STOCK_AUTH');
  });

  it('keeps the upstream status and detail on 403 (admin-only endpoint)', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 403, json: async () => ({ detail: '需要 admin 權限' }) }));
    const r = await StockService.proxy({ method: 'POST', path: '/crawler/run', token: 'T', body: { stock_id: '2330' } });
    expect(r.error.code).toBe('E502_STOCK_UPSTREAM');
    expect(r.error.status).toBe(403);
    expect(r.error.message).toBe('需要 admin 權限');
  });

  it('maps upstream failure to E502_STOCK_UPSTREAM with the upstream detail', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({ detail: '爬蟲服務未啟動' }) }));
    const r = await StockService.proxyGet('/forecast/weekly', {}, 'T');
    expect(r.error.code).toBe('E502_STOCK_UPSTREAM');
    expect(r.error.message).toBe('爬蟲服務未啟動');
  });

  it('maps a timeout to E502_STOCK_UPSTREAM', async () => {
    global.fetch = jest.fn(async (_url, opts) => new Promise((_resolve, reject) => {
      opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));
    const r = await StockService.proxy({ method: 'GET', path: '/stocks', token: 'T', timeoutMs: 5 });
    expect(r.error.code).toBe('E502_STOCK_UPSTREAM');
    expect(r.error.message).toBe('股票服務逾時');
  });
});
