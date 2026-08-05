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
        password: 'Password123',
        passwordChk: 'Password123'
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
        password: 'Password123',
        passwordChk: 'Password123'
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
        password: 'Password123',
        passwordChk: 'Password321'
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
        password: 'Password123',
        passwordChk: 'Password123'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dup@example.com',
        username: 'dup',
        account: 'dupuser',
        password: 'Password123',
        passwordChk: 'Password123'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      message: '註冊帳號已存在',
      data: {},
      error: { code: 'E001_USER_EXISTS' }
    });
  });
});

describe('PUT /api/auth/updatePassword', () => {
  const userInfo = {
    email: 'pwupdate@example.com',
    username: 'pwupdate',
    account: 'pwupdateuser',
    password: 'OldPassword123',
    passwordChk: 'OldPassword123'
  };
  let userId;
  let token;

  beforeAll(async () => {
    await db.query('DELETE FROM users WHERE email = $1', [userInfo.email]);
    const res = await request(app).post('/api/auth/register').send(userInfo);
    userId = res.body.data.user.id;
    token = res.body.data.token;
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
  });

  it('should return 200 on successful password update', async () => {
    const res = await request(app)
      .put('/api/auth/updatePassword')
      .set('Authorization', `Bearer ${token}`)
      .send({
        oirPassword: userInfo.password,
        newPassword: 'NewPassword456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: '更新成功',
      data: {}
    });
  });

  it('should return 401 if old password is incorrect', async () => {
    const res = await request(app)
      .put('/api/auth/updatePassword')
      .set('Authorization', `Bearer ${token}`)
      .send({
        oirPassword: 'WrongPassword999',
        newPassword: 'NewPassword456'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: '更新失敗，帳號密碼錯誤',
      data: {},
      error: { code: 'E003_INVALID_CREDENTIALS' }
    });
  });

  it('should return 401 if user was deleted after token issued', async () => {
    const ghostUser = {
      email: 'ghost_del@example.com',
      username: 'ghostdel',
      account: 'ghostdeluser',
      password: 'GhostPassword1',
      passwordChk: 'GhostPassword1'
    };
    const regRes = await request(app).post('/api/auth/register').send(ghostUser);
    const ghostToken = regRes.body.data.token;
    const ghostId = regRes.body.data.user.id;
    await db.query('DELETE FROM users WHERE id = $1', [ghostId]);

    const res = await request(app)
      .put('/api/auth/updatePassword')
      .set('Authorization', `Bearer ${ghostToken}`)
      .send({
        oirPassword: ghostUser.password,
        newPassword: 'NewPassword456'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: '更新失敗，使用者不存在',
      data: {},
      error: { code: 'E003_INVALID_CREDENTIALS' }
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
    password: 'Password123',
    passwordChk: 'Password123'
  };

  beforeAll(async () => {
    await db.query(`DELETE FROM users WHERE email = $1`, [userIno.email]);
    const userRes = await request(app)
      .post('/api/auth/register')
      .send(userIno);

    token = userRes.body.data.token;
    userId = userRes.body.data.user.id;
  });

  afterAll(async () => {
    await db.query(`DELETE FROM users WHERE email = $1`, [userIno.email]);
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

  // H-04：帳號不存在與密碼錯誤回傳相同訊息與錯誤碼（防帳號枚舉）
  it('should return 401 with generic error if account not exists', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        account: 'nonexistent@example.com',
        password: 'Password123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: '登入失敗，帳號或密碼錯誤',
      data: {},
      error: { code: 'E003_INVALID_CREDENTIALS' }
    });
  });

  it('should return 401 with generic error if password is incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        account: userIno.account,
        password: 'WrongPassword999'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: '登入失敗，帳號或密碼錯誤',
      data: {},
      error: { code: 'E003_INVALID_CREDENTIALS' }
    });
  });
});
