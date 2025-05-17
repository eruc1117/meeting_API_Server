const request = require('supertest');
const app = require('../../app'); // 匯入 Express app
const db = require('../../db'); // 匯入 DB 連線（如果要清資料）
const jwt = require('jsonwebtoken');
require('dotenv').config();

describe('POST /api/schedules', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // 先建立一個用戶並登入取得 token（或 mock token）
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'sched@example.com',
        account: 'scheduser',
        password: 'password123'
      });

    token = userRes.body.token;
    userId = userRes.body.user.id;


  });

  afterAll(async () => {
    await db.query(`DELETE FROM schedules WHERE user_id = ${userId}`);
    await db.query("DELETE FROM users WHERE email = 'sched@example.com'");
  });

  it('should create a schedule and return 201', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: userId,
        title: 'Meeting with John',
        description: 'Discuss project details',
        start_time: '2025-05-08 09:00:00',
        end_time: '2025-05-08 10:00:00'
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
        start_time: '2025-05-08 09:00:00',
        end_time: '2025-05-08 10:00:00'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', '帳號尚未登入');
  });

  
  it('應成功回傳用戶的行事曆事件', async () => {
    const res = await request(app)
      .get('/api/schedules')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.schedules).toBeDefined();
    expect(res.body.schedules.length).toBe(1);
    expect(res.body.schedules[0].title).toBe('Meeting with John');
  });

  it('未提供 JWT 時應回傳 401', async () => {
    const res = await request(app).get('/api/schedules');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch('帳號尚未登入');
  });

});

describe('PUT /api/schedules/:id', () => {
  let token;
  let userId;
  let scheduleId;

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

    console.log("token ---> ", token);
    console.log("userId ---> ", userId);

    const createRes = await request(app)
    .post('/api/schedules')
    .set('Authorization', `Bearer ${token}`)
    .send({
      user_id: userId,
      title: 'Meeting with John',
      description: 'Discuss project details',
      start_time: '2025-05-08 09:00:00',
      end_time: '2025-05-08 10:00:00'
    });

    scheduleId = createRes.body.schedule.id;
    console.log("scheduleId ---> ", scheduleId);
    
  });

  afterAll(async () => {
    await db.query(`DELETE FROM schedules WHERE user_id = ${userId}`);
    await db.query("DELETE FROM users WHERE email = 'sched@example.com'");
    await db.end();
  });

  const updatedSchedule = {
    id: scheduleId,
    user_id: userId,
    title: 'Updated Meeting',
    description: 'Updated details',
    start_time: '2025-05-08 10:00:00',
    end_time: '2025-05-08 11:00:00',
    created_at: '2025-05-08 09:00:00'
  };

  it('should return 200 and updated schedule if authorized', async () => {
    // SELECT 查詢該筆 schedule 是否存在

    const res = await request(app)
      .put(`/api/schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Meeting',
        description: 'Updated details',
        start_time: '2025-05-08 10:00:00',
        end_time: '2025-05-08 11:00:00'
      });


    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Schedule updated');
  });

  it('should return 401 if token is missing', async () => {
    const res = await request(app)
      .put(`/api/schedules/${scheduleId}`)
      .send({
        title: 'Updated Meeting',
        description: 'Updated details',
        start_time: '2025-05-08 10:00:00',
        end_time: '2025-05-08 11:00:00'
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('帳號尚未登入');
  });
});