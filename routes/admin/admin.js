const express = require('express');
const router = express.Router();
const AdminController = require('../../controllers/AdminController');

// 平台使用者管理（需 admin；掛在 routes/index.js 的 authMiddleware + adminMiddleware 之後）
router.get('/users', AdminController.listUsers);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

module.exports = router;
