const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// 匯入子路由模組
const authRoutes = require('./auth/auth');
const scheduleRoutes = require('./schedule/schedule');
const userRoutes = require('./user/user');
const usersRoutes = require('./users/users');
const stockRoutes = require('./stock/stock');

// 掛載到對應路徑
router.use('/auth', authRoutes);
router.use('/schedules', authMiddleware, scheduleRoutes);
router.use('/user', authMiddleware, userRoutes);
router.use('/users', authMiddleware, usersRoutes);
router.use('/stock', authMiddleware, stockRoutes);     // 股票儀表板唯讀代理（erucMoney）

module.exports = router;
