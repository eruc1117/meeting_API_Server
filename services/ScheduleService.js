const db = require('../db');
const validator = require("../utils/validator");
const Schedule = require("../models/Schedule");

class ScheduleService {
  static async createSchedule(user_id, title, description, start_time, end_time, isOpen) {
    if (!user_id || !title || !start_time || !end_time) {
      return {
        message: '活動建立失敗，資料未提供',
        error: { code: 'E012_MISSING_FIELDS' }
      };
    }

    const validateDateTimeSRe = validator.validateDateTime(start_time);
    const validateDateTimeERe = validator.validateDateTime(end_time);

    if (!validateDateTimeSRe || !validateDateTimeERe) {
      return {
        message: '活動建立失敗，資料格式錯誤',
        error: { code: 'E011_DATA_TYPE_ERROR' }
      };
    }

    const repeatChk = await Schedule.findEvent(user_id, start_time, end_time, 'id');

    if (repeatChk.length > 0) {
      return {
        message: '活動建立失敗，時段重複',
        error: { code: 'E006_SCHEDULE_CONFLICT' }
      };
    }

    try {
      const result = await db.query(
        `INSERT INTO schedules (user_id, title, description, start_time, end_time, isOpen)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user_id, title, description, start_time, end_time, isOpen]
      );

      return {
        message: '活動建立成功',
        schedule: result.rows[0]
      };
    } catch (err) {
      console.error('Schedule creation error:', err);
      return {
        message: '功能異常',
        error: { code: 'E010_SCHEDULE_SERVER' }
      };
    }
  }

  static async getSchedulesByUserId(user_id) {
    try {
      const result = await db.query(
        'SELECT * FROM schedules WHERE user_id = $1 ORDER BY start_time ASC',
        [user_id]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Database error');
    }
  }

  static async updateSchedule(user_id, schedule_id, title, description, start_time, end_time, isOpen) {
    try {
      const rows = await Schedule.findByIdAndUserId(schedule_id, user_id);

      if (rows.length === 0) {
        return { message: '找不到該行事曆或權限不足' };
      }

      const updated = await db.query(
        `UPDATE schedules
         SET title = $1, description = $2, start_time = $3, end_time = $4, isOpen = $5
         WHERE id = $6
         RETURNING *`,
        [title, description, start_time, end_time, isOpen, schedule_id]
      );

      return {
        message: '活動更新成功',
        schedule: updated.rows[0]
      };
    } catch (err) {
      console.error('UpdateSchedule service error:', err);
      throw err;
    }
  }

  static async deleteSchedule(user_id, schedule_id) {
    try {
      const rows = await Schedule.findByIdAndUserId(schedule_id, user_id);

      if (rows.length === 0) {
        return {
          message: '找不到該行事曆或權限不足',
          error: { code: 'E007_NOT_FOUND' }
        };
      }

      await db.query('DELETE FROM schedules WHERE id = $1', [schedule_id]);

      return { message: '活動刪除成功' };
    } catch (err) {
      console.error('DeleteSchedule service error:', err);
      throw err;
    }
  }

  static async attendSchedule(user_id, schedule_id) {
    try {
      const { rows } = await db.query(
        'SELECT id FROM schedules WHERE id = $1 AND isopen = true',
        [schedule_id]
      );

      if (rows.length === 0) {
        return {
          message: '活動參加失敗，活動不存在或已關閉',
          error: { code: 'E007_NOT_FOUND' },
          code: 400
        };
      }

      await db.query(
        'INSERT INTO event_members (user_id, schedule_id) VALUES ($1, $2)',
        [user_id, schedule_id]
      );

      return {
        message: '活動參加成功',
        code: 200
      };
    } catch (err) {
      console.error('attendSchedule error:', err);
      throw err;
    }
  }

  static async unattendSchedule(user_id, schedule_id) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM event_members WHERE user_id = $1 AND schedule_id = $2',
        [user_id, schedule_id]
      );

      if (rows.length === 0) {
        return {
          message: '活動退出失敗，使用者未參加該活動',
          error: { code: 'E007_NOT_FOUND' },
          code: 400
        };
      }

      await db.query(
        'DELETE FROM event_members WHERE user_id = $1 AND schedule_id = $2',
        [user_id, schedule_id]
      );

      return {
        message: '活動退出成功',
        code: 200
      };
    } catch (err) {
      console.error('unattendSchedule error:', err);
      throw err;
    }
  }
}

module.exports = ScheduleService;
