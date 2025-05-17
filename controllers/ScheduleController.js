const ScheduleService = require('../services/ScheduleService');

class ScheduleController {
  static async create(req, res) {
    try {
      const { title, description, start_time, end_time } = req.body;
      const user_id = req.user.id;
      const result = await ScheduleService.createSchedule(user_id, title, description, start_time, end_time);
      return res.status(result.status).json(result.body);
    } catch (err) {
      console.error('Controller error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUserSchedules(req, res) {
    try {
      const user_id = req.user.id; // 由 JWT middleware 解出
      const schedules = await ScheduleService.getSchedulesByUserId(user_id);
      return res.status(200).json({ schedules });
    } catch (error) {
      console.error('Get schedules error:', error);
      return res.status(500).json({ message: '伺服器回傳錯誤訊息' });
    }
  }

  static async update(req, res) {
    try {
      const user_id = req.user.id; // JWT middleware 解出
      const scheduleId = Number(req.params.id);
      const { title, description, start_time, end_time } = req.body;

      const result = await ScheduleService.updateSchedule(
        user_id,
        scheduleId,
        title,
        description,
        start_time,
        end_time
      );

      return res.status(result.status).json(result.body);
    } catch (err) {
      console.error('Update schedule error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async delete(req, res) {
    try {
      const user_id = req.user.id; // 從 JWT middleware 取得
      const scheduleId = parseInt(req.params.id, 10);

      const result = await ScheduleService.deleteSchedule(user_id, scheduleId);

      return res.status(result.status).json(result.body);
    } catch (err) {
      console.error('Delete schedule error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

}

module.exports = ScheduleController;
