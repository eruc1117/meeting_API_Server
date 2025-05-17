const express = require('express');
const router = express.Router();
const ScheduleController = require("../../controllers/ScheduleController");
const authenticateToken = require("../../middlewares/authMiddleware")


router.post('/', authenticateToken, ScheduleController.create);
router.get('/', authenticateToken, ScheduleController.getUserSchedules);
router.put('/:id', authenticateToken, ScheduleController.update);
router.delete('/:id', authenticateToken, ScheduleController.delete);

module.exports = router;
