const request = require('supertest');
const app = require('../../app');
const db = require('../../db');

describe('POST /api/auth/register', () => {
  afterAll(async () => {
    await db.query("DELETE FROM users WHERE email IN ('user@example.com', 'user2@example.com', 'user3@example.com', 'dup@example.com')");
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        username: 'user',
        account: 'account01',
        password: 'password123',
        passwordChk: 'password123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: '使用者註冊成功',
      data: {
        user: expect.objectContaining({ id: expect.any(Number) }),
        token: expect.any(String)
      }
    });
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        username: 'user2',
        account: 'account02',
        password: 'password123',
        passwordChk: 'password123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      message: '電子信箱格式錯誤',
      data: {},
      error: { code: 'E002_INVALID_EMAIL' }
    });
  });

  it('should return 400 if passwords do not match', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user3@example.com',
        username: 'user3',
        account: 'account03',
        password: 'password123',
        passwordChk: 'password321'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      message: '密碼和確認密碼不同',
      data: {},
      error: { code: 'E009_PASSWORD_NOT_SAME' }
    });
  });

  it('should return 409 for duplicate user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dup@example.com',
        username: 'dup',
        account: 'dupuser',
        password: 'password123',
        passwordChk: 'password123'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dup@example.com',
        username: 'dup',
        account: 'dupuser',
        password: 'password123',
        passwordChk: 'password123'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      message: '註冊帳號已存在',
      data: {},
      error: { code: 'E001_USER_EXISTS' }
    });
  });
});

describe('POST /api/auth/login', () => {
  let token;
  let userId;
  let userIno = {
    email: 'sched@example.com',
    username: 'schedule',
    account: 'scheduser',
    password: 'password123',
    passwordChk: 'password123'
  };

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send(userIno);


    token = userRes.body.data.token;
    userId = userRes.body.data.user.id;
  });

  afterAll(async () => {
    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await db.end();
  });

  it('should return 200 with token if login successful', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        account: userIno.account,
        password: userIno.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: '登入成功',
      data: {
        user: expect.objectContaining({
          id: userId,
          email: userIno.email,
          username: userIno.username
        }),
        token: expect.any(String)
      }
    });
  });

  it('should return 401 if account not exists', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        account: 'nonexistent@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: '登入失敗，帳號不存在',
      data: {},
      error: { code: 'E008_ACCOUNT_NOT_EXIST' }
    });
  });

  it('should return 401 if password is incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        account: userIno.account,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: '登入失敗，帳號密碼錯誤',
      data: {},
      error: { code: 'E003_INVALID_CREDENTIALS' }
    });
  });
});
