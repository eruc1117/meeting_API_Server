const express = require('express');
const router = express.Router();
const ScheduleController = require("../../controllers/ScheduleController");

router.post('/', ScheduleController.create);
router.post('/query', ScheduleController.getUserSchedules);
router.put('/:id', ScheduleController.update);
router.delete('/:id', ScheduleController.delete);
router.post('/attend/:id', ScheduleController.attend);
router.delete('/attend/:id', ScheduleController.unattend);

module.exports = router;
