const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
require('dotenv').config();

describe('Schedule API 測試', () => {
  let token;
  let userId;
  let scheduleId;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'sched@example.com',
        username: 'schedule',
        account: 'scheduser',
        password: 'password123',
        passwordChk: 'password123'
      });

    token = userRes.body.data.token;
    userId = userRes.body.data.user.id;
  });

  afterAll(async () => {
    await db.query(`DELETE FROM schedules WHERE user_id = $1`, [userId]);
    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await db.end();
  });

  describe('POST /api/schedules', () => {
    it('成功建立行事曆事件', async () => {
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
      expect(res.body.message).toBe('活動建立成功');
      expect(res.body.data).toHaveProperty('title', 'Meeting with John');
      scheduleId = res.body.data.id;
    });

    it('缺少必要欄位應回傳 404', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_time: '2025-05-08 09:00:00',
          end_time: '2025-05-08 10:00:00'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('活動建立失敗，資料未提供');
      expect(res.body.error.code).toBe('E007_NOT_FOUND');
    });

    it('活動建立失敗，時段重複', async () => {
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

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe('活動建立失敗，時段重複');
      expect(res.body.error.code).toBe('E006_SCHEDULE_CONFLICT');
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .send({
          user_id: userId,
          title: 'Unauthorized',
          description: 'Missing token',
          start_time: '2025-05-08 09:00:00',
          end_time: '2025-05-08 10:00:00'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('帳號尚未登入');
      expect(res.body.error.code).toBe('E004_UNAUTHORIZED');
    });
  });

  describe('GET /api/schedules', () => {
    it('成功取得行事曆事件', async () => {
      const res = await request(app)
        .get('/api/schedules')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app).get('/api/schedules');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('帳號尚未登入');
      expect(res.body.error.code).toBe('E004_UNAUTHORIZED');
    });
  });

  describe('PUT /api/schedules/:id', () => {
    let eventID;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: userId,
          title: 'Meeting with John',
          description: 'Discuss project details',
          start_time: '2025-05-08 11:00:00',
          end_time: '2025-05-08 12:00:00'
        });

      console.log("res.body.data ---> ", res.body);

      eventID = res.body.data.id;
      
    });



    it('成功更新行事曆事件', async () => {
      const res = await request(app)
        .put(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: eventID,
          title: 'Updated Title',
          description: 'Updated Description',
          start_time: '2025-05-08 10:00:00',
          end_time: '2025-05-08 11:00:00'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('活動更新成功');
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app)
        .put(`/api/schedules/${scheduleId}`)
        .send({
          id: eventID,
          title: 'Unauthorized update',
          description: 'No token',
          start_time: '2025-05-08 12:00:00',
          end_time: '2025-05-08 13:00:00'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('帳號尚未登入');
      expect(res.body.error.code).toBe('E004_UNAUTHORIZED');
    });

    it('活動更新失敗，時段重複', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: eventID,
          title: 'Updated Title',
          description: 'Updated Description',
          start_time: '2025-05-08 10:00:00',
          end_time: '2025-05-08 11:00:00'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe('活動建立失敗，時段重複');
      expect(res.body.error.code).toBe('E006_SCHEDULE_CONFLICT');
    });

  });

  describe('DELETE /api/schedules/:id', () => {
    it('成功刪除事件', async () => {
      const res = await request(app)
        .delete(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('活動刪除成功');
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app)
        .delete(`/api/schedules/${scheduleId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('帳號尚未登入');
      expect(res.body.error.code).toBe('E004_UNAUTHORIZED');
    });
  });
});
