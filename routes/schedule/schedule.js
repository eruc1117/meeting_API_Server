const express = require('express');
const router = express.Router();
const ScheduleController = require("../../controllers/ScheduleController");
const authenticateToken = require("../../middlewares/authMiddleware")


router.post('/', authenticateToken, ScheduleController.create);
router.get('/', authenticateToken, ScheduleController.getUserSchedules);
router.put('/:id', authenticateToken, ScheduleController.update);

module.exports = router;
