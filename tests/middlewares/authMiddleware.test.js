const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middlewares/authMiddleware');
require('dotenv').config();

const app = express();
app.use(express.json());

// 模擬一個受保護的路由
app.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Access granted', user: req.user });
});

describe('authMiddleware', () => {
  const validToken = jwt.sign({ id: 1, account: 'user1' }, process.env.SECRET, {
    expiresIn: '1h',
  });

  it('should return 401 if no token provided', async () => {
    const res = await request(app).get('/protected');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('帳號尚未登入');
  });

  it('should return 401 if token is invalid', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Token 無效或已過期');
  });

  it('should pass and attach user if token is valid', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Access granted');
    expect(res.body.user).toEqual(expect.objectContaining({ id: 1, account: 'user1' }));
  });
});
