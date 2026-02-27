const request = require('supertest');
const app = require('../../app');
const db = require('../../db');

describe('GET /api/user/info', () => {
  let tokenA, userIdA;
  let tokenB, userIdB;

  const userA = {
    email: 'userinfo_a@example.com',
    username: 'userinfoA',
    account: 'userinfoA',
    password: 'password123',
    passwordChk: 'password123'
  };

  const userB = {
    email: 'userinfo_b@example.com',
    username: 'userinfoB',
    account: 'userinfoB',
    password: 'password123',
    passwordChk: 'password123'
  };

  beforeAll(async () => {
    await db.query('DELETE FROM users WHERE email IN ($1, $2)', [userA.email, userB.email]);

    const resA = await request(app).post('/api/auth/register').send(userA);
    tokenA = resA.body.data.token;
    userIdA = resA.body.data.user.id;

    const resB = await request(app).post('/api/auth/register').send(userB);
    tokenB = resB.body.data.token;
    userIdB = resB.body.data.user.id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [userIdA, userIdB]);
  });

  it('should return 200 with user data', async () => {
    const res = await request(app)
      .get(`/api/user/info?id=${userIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: '成功',
      data: {
        id: userIdA,
        email: userA.email,
        username: userA.username,
        account: userA.account
      }
    });
  });

  it('should return 403 if querying another user\'s data', async () => {
    const res = await request(app)
      .get(`/api/user/info?id=${userIdB}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      message: '查詢失敗，無權限查詢其他使用者資料',
      data: {},
      error: { code: 'E005_FORBIDDEN' }
    });
  });

  it('should return 400 if id is missing', async () => {
    const res = await request(app)
      .get('/api/user/info')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      message: '查詢失敗，缺少必要資料',
      data: {},
      error: { code: 'E012_MISSING_FIELDS' }
    });
  });

  it('should return 401 if no token provided', async () => {
    const res = await request(app).get(`/api/user/info?id=${userIdA}`);

    expect(res.statusCode).toBe(401);
  });
});
