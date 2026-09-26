const express = require('express');
const router = express.Router();
const StockController = require('../../controllers/StockController');

// 股票系統代理（需登入；掛在 routes/index.js 的 authMiddleware 之後）
// 方法、路徑、query、body 原樣轉到 erucMoney；權限由上游判斷。允許的路徑前綴在 StockService。
router.get('/health', StockController.health);
router.all('/{*path}', StockController.proxy);   // Express 5 萬用路由語法

module.exports = router;
