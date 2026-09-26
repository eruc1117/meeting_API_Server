const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middlewares/authMiddleware');
const adminMiddleware = require('../../middlewares/adminMiddleware');
require('dotenv').config();

const app = express();
app.get('/admin-only', authMiddleware, adminMiddleware, (req, res) => res.json({ ok: true, role: req.user.role }));

describe('adminMiddleware', () => {
  const sign = (payload) => jwt.sign(payload, process.env.SECRET, { expiresIn: '1h' });

  it('403 for a user token', async () => {
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${sign({ id: 1, username: 'u', role: 'user' })}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('E005_FORBIDDEN');
  });

  it('403 for a legacy token without role', async () => {
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${sign({ id: 1, username: 'u' })}`);
    expect(res.statusCode).toBe(403);
  });

  it('passes an admin token', async () => {
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${sign({ id: 1, username: 'u', role: 'admin' })}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('401 without a token (authMiddleware first)', async () => {
    const res = await request(app).get('/admin-only');
    expect(res.statusCode).toBe(401);
  });
});
