const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/AuthController');
const authMiddleware = require('../../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// 登入限制：每 IP 每分鐘最多 5 次（防暴力破解，短視窗快速鎖定）
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '登入嘗試次數過多，請稍後再試', error: { code: 'E429_RATE_LIMIT' } },
});

// 註冊限制：每 IP 每小時最多 10 次（防止大量假帳號）
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '註冊次數過多，請稍後再試', error: { code: 'E429_RATE_LIMIT' } },
});

router.post('/register', registerLimiter, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.put('/updatePassword', authMiddleware, AuthController.updatePassword);

module.exports = router;
