// /api/admin/users（整套平台共用的 admin 身分）— http 層，用測試資料庫
const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const { createUser, deleteUsers } = require('../helpers/users');
const { userToken, adminToken } = require('../helpers/tokens');

describe('/api/admin/users', () => {
  let admin, plain, target;
  let adminTok, plainTok;
  const ids = [];

  beforeAll(async () => {
    admin = await createUser({ account: 'adm_http', role: 'admin' });
    plain = await createUser({ account: 'usr_http', role: 'user' });
    target = await createUser({ account: 'tgt_http', role: 'user' });
    ids.push(admin.id, plain.id, target.id);
    adminTok = adminToken(admin.id, admin.username);
    plainTok = userToken(plain.id, plain.username);
  });

  afterAll(async () => {
    await deleteUsers(ids);
    await db.end();
  });

  it('未登入 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });

  it('一般使用者 403 E005_FORBIDDEN', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${plainTok}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('E005_FORBIDDEN');
  });

  it('admin 列出使用者：含 role、is_active，不含密碼', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminTok}`);
    expect(res.statusCode).toBe(200);
    const rows = res.body.data.users;
    const me = rows.find((u) => u.id === admin.id);
    expect(me).toEqual(expect.objectContaining({ account: 'adm_http', role: 'admin', is_active: true }));
    expect(me.password_hash).toBeUndefined();
    expect(rows.some((u) => u.id === target.id)).toBe(true);
  });

  it('改角色：user → admin → user', async () => {
    let res = await request(app).put(`/api/admin/users/${target.id}`).set('Authorization', `Bearer ${adminTok}`).send({ role: 'admin' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
    res = await request(app).put(`/api/admin/users/${target.id}`).set('Authorization', `Bearer ${adminTok}`).send({ role: 'user' });
    expect(res.body.data.user.role).toBe('user');
  });

  it('角色不是 user/admin → 400', async () => {
    const res = await request(app).put(`/api/admin/users/${target.id}`).set('Authorization', `Bearer ${adminTok}`).send({ role: 'root' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('E011_DATA_TYPE_ERROR');
  });

  it('沒有欄位 → 400 E012', async () => {
    const res = await request(app).put(`/api/admin/users/${target.id}`).set('Authorization', `Bearer ${adminTok}`).send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('E012_MISSING_FIELDS');
  });

  it('停用後不能登入，啟用後可以', async () => {
    let res = await request(app).put(`/api/admin/users/${target.id}`).set('Authorization', `Bearer ${adminTok}`).send({ is_active: false });
    expect(res.body.data.user.is_active).toBe(false);
    res = await request(app).post('/api/auth/login').send({ account: 'tgt_http', password: 'Password123' });
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('E014_ACCOUNT_DISABLED');
    res = await request(app).put(`/api/admin/users/${target.id}`).set('Authorization', `Bearer ${adminTok}`).send({ is_active: true });
    expect(res.body.data.user.is_active).toBe(true);
    res = await request(app).post('/api/auth/login').send({ account: 'tgt_http', password: 'Password123' });
    expect(res.statusCode).toBe(200);
  });

  it('改自己 403、刪自己 403', async () => {
    let res = await request(app).put(`/api/admin/users/${admin.id}`).set('Authorization', `Bearer ${adminTok}`).send({ role: 'user' });
    expect(res.statusCode).toBe(403);
    res = await request(app).delete(`/api/admin/users/${admin.id}`).set('Authorization', `Bearer ${adminTok}`);
    expect(res.statusCode).toBe(403);
    const { rows } = await db.query('SELECT role FROM users WHERE id = $1', [admin.id]);
    expect(rows[0].role).toBe('admin');
  });

  it('不存在的使用者 404', async () => {
    let res = await request(app).put('/api/admin/users/999999').set('Authorization', `Bearer ${adminTok}`).send({ role: 'admin' });
    expect(res.statusCode).toBe(404);
    res = await request(app).delete('/api/admin/users/999999').set('Authorization', `Bearer ${adminTok}`);
    expect(res.statusCode).toBe(404);
  });

  it('id 不是數字 400', async () => {
    const res = await request(app).delete('/api/admin/users/abc').set('Authorization', `Bearer ${adminTok}`);
    expect(res.statusCode).toBe(400);
  });

  it('刪除使用者連帶刪掉他的行程', async () => {
    const victim = await createUser({ account: 'victim_http' });
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    const start = nextMonth.toISOString();
    const end = new Date(nextMonth.getTime() + 3600e3).toISOString();
    await db.query('INSERT INTO schedules (user_id, title, start_time, end_time, is_public) VALUES ($1, $2, $3, $4, true)', [victim.id, 'to be deleted', start, end]);

    const res = await request(app).delete(`/api/admin/users/${victim.id}`).set('Authorization', `Bearer ${adminTok}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(victim.id);
    const { rowCount: users } = await db.query('SELECT 1 FROM users WHERE id = $1', [victim.id]);
    const { rowCount: schedules } = await db.query('SELECT 1 FROM schedules WHERE user_id = $1', [victim.id]);
    expect(users).toBe(0);
    expect(schedules).toBe(0);
  });
});
