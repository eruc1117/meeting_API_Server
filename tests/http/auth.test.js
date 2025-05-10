const request = require('supertest');
const app = require('../../app'); // 匯入 Express app
const db = require('../../db'); // 匯入資料庫連線（若需初始化/清除資料）

describe('POST /api/auth/register', () => {
  afterAll(async () => {
    // 清除測試資料（根據實際 DB 規則來定）
    await db.query("DELETE FROM users WHERE email = 'user@example.com'");
    await db.end(); // 關閉 DB
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ID: 'testuser',
        email: 'user@example.com',
        account: 'username',
        password: 'password123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User created');
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ID: 'testuser',
        email: 'invalid-email',
        account: 'username2',
        password: 'password123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid email format');
  });

  it('should return 409 for duplicate user', async () => {
    // 第一次創建成功
    await request(app)
      .post('/api/auth/register')
      .send({
        ID: 'duplicateuser',
        email: 'dup@example.com',
        account: 'dupuser',
        password: 'password123'
      });

    // 第二次重複
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ID: 'duplicateuser',
        email: 'dup@example.com',
        account: 'dupuser',
        password: 'password123'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });
});
