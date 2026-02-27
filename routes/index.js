const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// 匯入子路由模組
const authRoutes = require('./auth/auth');
const scheduleRoutes = require('./schedule/schedule');
const userRoutes = require('./user/user');

// 掛載到對應路徑
router.use('/auth', authRoutes);
router.use('/schedules', authMiddleware, scheduleRoutes);
router.use('/user', authMiddleware, userRoutes);

module.exports = router;
