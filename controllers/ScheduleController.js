const ScheduleService = require('../services/ScheduleService');
const { sendResponse } = require('../utils/responseHelper');

class ScheduleController {
  static async create(req, res) {
    try {
      const { title, description, start_time, end_time, is_public, location, participants } = req.body;
      const user_id = req.user.id;
      const result = await ScheduleService.createSchedule(user_id, title, description, start_time, end_time, is_public, location, participants);
      sendResponse(res, result, 201);
    } catch (err) {
      console.error('Controller error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUserSchedules(req, res) {
    try {
      const user_id = req.user.id;
      const result = await ScheduleService.getSchedulesByUserId(user_id);
      sendResponse(res, result, 200);
    } catch (error) {
      console.error('Get schedules error:', error);
      return res.status(500).json({ message: '伺服器回傳錯誤訊息' });
    }
  }

  static async update(req, res) {
    try {
      const user_id = req.user.id;
      const scheduleId = Number(req.params.id);
      const { title, description, start_time, end_time, is_public, location, participants } = req.body;
      const result = await ScheduleService.updateSchedule(user_id, scheduleId, title, description, start_time, end_time, is_public, location, participants);
      sendResponse(res, result, 200);
    } catch (err) {
      console.error('Update schedule error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async delete(req, res) {
    try {
      const user_id = req.user.id;
      const scheduleId = parseInt(req.params.id, 10);
      const result = await ScheduleService.deleteSchedule(user_id, scheduleId);
      sendResponse(res, result, 200);
    } catch (err) {
      console.error('Delete schedule error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async attend(req, res) {
    try {
      const user_id = req.user.id;
      const scheduleId = parseInt(req.params.id, 10);
      const result = await ScheduleService.attendSchedule(user_id, scheduleId);
      sendResponse(res, result, 200);
    } catch (err) {
      console.error('Attend schedule error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async unattend(req, res) {
    try {
      const user_id = req.user.id;
      const scheduleId = parseInt(req.params.id, 10);
      const result = await ScheduleService.unattendSchedule(user_id, scheduleId);
      sendResponse(res, result, 200);
    } catch (err) {
      console.error('Unattend schedule error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = ScheduleController;
