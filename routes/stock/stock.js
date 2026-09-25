const express = require('express');
const router = express.Router();
const StockController = require('../../controllers/StockController');

// 股票儀表板唯讀代理（需登入；掛在 routes/index.js 的 authMiddleware 之後）
router.get('/health', StockController.health);
router.get('/{*path}', StockController.proxy);   // Express 5 萬用路由語法；白名單在 StockService

module.exports = router;
