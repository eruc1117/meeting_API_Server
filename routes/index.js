const express = require('express');
const router = express.Router();

// 匯入子路由模組
const authRoutes = require('./auth/auth');

// 掛載到對應路徑
router.use('/auth', authRoutes);

module.exports = router;
