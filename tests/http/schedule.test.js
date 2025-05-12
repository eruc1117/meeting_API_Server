const request = require('supertest');
const app = require('../../app'); // 匯入 Express app
const db = require('../../db'); // 匯入 DB 連線（如果要清資料）

describe('POST /api/schedules', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // 先建立一個用戶並登入取得 token（或 mock token）
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'sched@example.com',
        account: 'scheduser',
        password: 'password123'
      });

    token = res.body.token;
    userId = res.body.user.id;
    
  });

  afterAll(async () => {
    await db.query(`DELETE FROM schedules WHERE user_id = ${userId}`);
    await db.query("DELETE FROM users WHERE email = 'sched@example.com'");
    await db.end();
  });

  it('should create a schedule and return 201', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        title: 'Meeting with John',
        description: 'Discuss project details',
        start_time: '2025-05-08T09:00:00',
        end_time: '2025-05-08T10:00:00'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Event created');
    expect(res.body.schedule).toHaveProperty('title', 'Meeting with John');
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Incomplete Event'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 if no token provided', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .send({
        user_id: userId,
        title: 'Test',
        description: 'Test',
        start_time: '2025-05-08T09:00:00',
        end_time: '2025-05-08T10:00:00'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', '帳號尚未登入');
  });
});
