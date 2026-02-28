const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
require('dotenv').config();

describe('Schedule API 測試', () => {
  let token;
  let userId;
  let scheduleId;

  beforeAll(async () => {
    await db.query(`DELETE FROM users WHERE email = $1`, ['sched@example.com']);
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

  describe('POST /api/schedules/create', () => {
    it('成功建立行事曆事件', async () => {
      const res = await request(app)
        .post('/api/schedules/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Meeting with John',
          description: 'Discuss project details',
          start_time: '2025-05-08 09:00:00',
          end_time: '2025-05-08 10:00:00',
          is_public: true
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('活動建立成功');
      expect(res.body.data).toHaveProperty('title', 'Meeting with John');
      scheduleId = res.body.data.id;
    });

    it('缺少必要欄位應回傳 400', async () => {
      const res = await request(app)
        .post('/api/schedules/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_time: '2025-05-08 09:00:00',
          end_time: '2025-05-08 10:00:00'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('活動建立失敗，資料未提供');
      expect(res.body.error.code).toBe('E012_MISSING_FIELDS');
    });

    it('活動建立失敗，時段重複', async () => {
      const res = await request(app)
        .post('/api/schedules/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
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
        .post('/api/schedules/create')
        .send({ title: 'Unauthorized', start_time: '2025-05-08 09:00:00', end_time: '2025-05-08 10:00:00' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('帳號尚未登入');
      expect(res.body.error.code).toBe('E004_UNAUTHORIZED');
    });
  });

  describe('POST /api/schedules/query', () => {
    it('成功取得行事曆事件', async () => {
      const res = await request(app)
        .post('/api/schedules/query')
        .set('Authorization', `Bearer ${token}`)
        .send({ user_id: userId });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('活動查詢成功');
      expect(res.body.data.schedule).toBeDefined();
      expect(Array.isArray(res.body.data.schedule)).toBe(true);
    });

    it('帶時間範圍查詢', async () => {
      const res = await request(app)
        .post('/api/schedules/query')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: userId,
          start_time: '2025-01-01T00:00:00',
          end_time: '2025-12-31T23:59:59'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('活動查詢成功');
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app)
        .post('/api/schedules/query')
        .send({ user_id: userId });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('帳號尚未登入');
      expect(res.body.error.code).toBe('E004_UNAUTHORIZED');
    });
  });

  describe('PUT /api/schedules/update/:id', () => {
    let eventId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/schedules/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Before Update',
          description: 'Before',
          start_time: '2025-05-08 11:00:00',
          end_time: '2025-05-08 12:00:00',
          is_public: true
        });

      eventId = res.body.data.id;
    });

    it('成功更新行事曆事件', async () => {
      const res = await request(app)
        .put(`/api/schedules/update/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          start_time: '2025-05-08 11:00:00',
          end_time: '2025-05-08 12:00:00',
          is_public: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('活動更新成功');
    });

    it('活動不存在或無權限應回傳 404', async () => {
      const res = await request(app)
        .put('/api/schedules/update/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          start_time: '2025-05-08 11:00:00',
          end_time: '2025-05-08 12:00:00'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('活動更新失敗');
      expect(res.body.error.code).toBe('E007_NOT_FOUND');
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app)
        .put(`/api/schedules/update/${eventId}`)
        .send({ title: 'No token' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('帳號尚未登入');
      expect(res.body.error.code).toBe('E004_UNAUTHORIZED');
    });
  });

  describe('DELETE /api/schedules/delete/:id', () => {
    it('成功刪除事件', async () => {
      const res = await request(app)
        .delete(`/api/schedules/delete/${scheduleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('活動刪除成功');
    });

    it('活動不存在或無權限應回傳 404', async () => {
      const res = await request(app)
        .delete('/api/schedules/delete/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('活動刪除失敗');
      expect(res.body.error.code).toBe('E007_NOT_FOUND');
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app).delete(`/api/schedules/delete/${scheduleId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('帳號尚未登入');
      expect(res.body.error.code).toBe('E004_UNAUTHORIZED');
    });
  });

  describe('POST /api/schedules/attend/:id', () => {
    let openScheduleId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/schedules/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Open Event',
          description: 'Open to all',
          start_time: '2025-06-01 09:00:00',
          end_time: '2025-06-01 10:00:00',
          is_public: true
        });

      openScheduleId = res.body.data.id;
    });

    it('成功參加活動', async () => {
      const res = await request(app)
        .post(`/api/schedules/attend/${openScheduleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('活動參加成功');
    });

    it('活動不存在或已關閉應回傳 404', async () => {
      const res = await request(app)
        .post('/api/schedules/attend/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('活動參加失敗，活動不存在或已關閉');
      expect(res.body.error.code).toBe('E007_NOT_FOUND');
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app).post(`/api/schedules/attend/${openScheduleId}`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/schedules/attend/:id', () => {
    let openScheduleId;

    beforeAll(async () => {
      const createRes = await request(app)
        .post('/api/schedules/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Attend Then Leave',
          description: 'test',
          start_time: '2025-07-01 09:00:00',
          end_time: '2025-07-01 10:00:00',
          is_public: true
        });

      openScheduleId = createRes.body.data.id;

      await request(app)
        .post(`/api/schedules/attend/${openScheduleId}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('成功退出活動', async () => {
      const res = await request(app)
        .delete(`/api/schedules/attend/${openScheduleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('活動退出成功');
    });

    it('未參加該活動應回傳 404', async () => {
      const res = await request(app)
        .delete('/api/schedules/attend/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('活動退出失敗，使用者未參加該活動');
      expect(res.body.error.code).toBe('E007_NOT_FOUND');
    });

    it('未提供 JWT 應回傳 401', async () => {
      const res = await request(app).delete(`/api/schedules/attend/${openScheduleId}`);
      expect(res.statusCode).toBe(401);
    });
  });
});
