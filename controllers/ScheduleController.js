const ScheduleService = require('../services/ScheduleService');

class ScheduleController {
  static 
  async create(req, res) {
    try {
      const {user_id, title, description, start_time, end_time} = req.body;
      const result = await ScheduleService.createSchedule(user_id, title, description, start_time, end_time);
      return res.status(result.status).json(result.body);
    } catch (err) {
      console.error('Controller error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = ScheduleController;
