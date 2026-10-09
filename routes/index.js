const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// 匯入子路由模組
const authRoutes = require('./auth/auth');
const scheduleRoutes = require('./schedule/schedule');
const userRoutes = require('./user/user');
const usersRoutes = require('./users/users');
const stockRoutes = require('./stock/stock');
const adminRoutes = require('./admin/admin');

// 掛載到對應路徑
router.use('/auth', authRoutes);
router.use('/schedules', authMiddleware, scheduleRoutes);
router.use('/user', authMiddleware, userRoutes);
router.use('/users', authMiddleware, usersRoutes);
router.use('/stock', optionalAuthMiddleware, stockRoutes);   // 股票系統代理（erucMoney）：分析類 GET 免登入，其餘在 StockService 擋（Iteration 52）
router.use('/admin', authMiddleware, adminMiddleware, adminRoutes);   // 平台使用者管理（admin）

module.exports = router;
