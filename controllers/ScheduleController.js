const ScheduleService = require('../services/ScheduleService');
const {mapErrorCodeToStatusCode} = require("../utils/httpStatusMapper");

class ScheduleController {
  static async create(req, res) {
    try {
      const { title, description, start_time, end_time } = req.body;

      const user_id = req.user.id;
      const result = await ScheduleService.createSchedule(user_id, title, description, start_time, end_time);
      
      let status;
      let returnBody = {
        message: result.message,
        data: result.schedule
      }

      if (result.error) {
        status = mapErrorCodeToStatusCode(result.error.code)
        returnBody["error"] = {code: result.error.code}
      } else {
        status = 201;
      }

      
      res.status(status).json(returnBody);
    } catch (err) {
      console.error('Controller error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUserSchedules(req, res) {
    try {
      const user_id = req.user.id; // 由 JWT middleware 解出
      const result = await ScheduleService.getSchedulesByUserId(user_id);

      let status;
      let returnBody = {
        data: result
      }

      if (result.error) {
        status = mapErrorCodeToStatusCode(result.error.code)
        returnBody["error"] = {code: result.error.code}
      } else {
        status = 200;
      }
      
      res.status(status).json(returnBody);
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

      let status;
      let returnBody = {
        message: result.message,
        data: result.schedule
      }

      if (result.error) {
        status = mapErrorCodeToStatusCode(result.error.code)
        returnBody["error"] = {code: result.error.code}
      } else {
        status = 200;
      }
      res.status(status).json(returnBody);
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

      let status;
      let returnBody = {
        message: result.message,
        data: result.data
      }

      if (result.error) {
        status = mapErrorCodeToStatusCode(result.error.code)
        returnBody["error"] = {code: result.error.code}
      } else {
        status = 200;
      }
       
      res.status(status).json(returnBody);
    } catch (err) {
      console.error('Delete schedule error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

}

module.exports = ScheduleController;
