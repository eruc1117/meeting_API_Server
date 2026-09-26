// CORS 白名單、body 大小上限、登入限流 — http 層
const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const { createUser, deleteUsers } = require('../helpers/users');

describe('安全設定', () => {
  const ids = [];
  afterAll(async () => { await deleteUsers(ids); await db.end(); });

  it('ALLOWED_ORIGINS 內的 Origin 回 access-control-allow-origin', async () => {
    const res = await request(app).options('/api/auth/login').set('Origin', 'https://erucmoney.com').set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBe('https://erucmoney.com');
  });

  it('ALLOWED_ORIGINS 外的 Origin 沒有 access-control-allow-origin', async () => {
    const res = await request(app).get('/api/user/info').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('helmet 安全標頭存在', async () => {
    const res = await request(app).get('/api/user/info');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('超過 256kb 的 JSON body 回 413', async () => {
    const big = { content: 'x'.repeat(300 * 1024) };
    const res = await request(app).post('/api/auth/login').send(big);
    expect(res.statusCode).toBe(413);
  });

  it('登入連打 6 次，第 6 次 429 E429_RATE_LIMIT', async () => {
    const u = await createUser({ account: 'ratelimit_u' });
    ids.push(u.id);
    let last;
    for (let i = 0; i < 6; i++) {
      last = await request(app).post('/api/auth/login').send({ account: 'ratelimit_u', password: 'WrongPassword1' });
      if (i < 5) expect(last.statusCode).toBe(401);
    }
    expect(last.statusCode).toBe(429);
    expect(last.body.error.code).toBe('E429_RATE_LIMIT');
    expect(last.headers['ratelimit-limit'] || last.headers['ratelimit']).toBeDefined();
  });
});
