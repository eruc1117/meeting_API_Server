const db = require('../db');
const validator = require("../utils/validator");
const Schedule = require("../models/Schedule")

class ScheduleService {
  static async createSchedule(user_id, title, description, start_time, end_time) {

    const validateDateTimeSRe = validator.validateDateTime(start_time);
    const validateDateTimeERe = validator.validateDateTime(end_time);

    if (!validateDateTimeSRe || !validateDateTimeERe) {
      return {
        message: "活動建立失敗，資料格式錯誤",
        error: {
          code: "E011_DATA_TYPE_ERROR"
        }
      }
    }


    if (!user_id || !title || !start_time || !end_time) {
      return {
        message: '活動建立失敗，資料未提供',
        error: {
          code: "E007_NOT_FOUND"
        }
      };
    }

    const repeatChk = await Schedule.findEvent(user_id, start_time, end_time, "id");

    if (repeatChk.length > 0) {
      return {
        message: '活動建立失敗，時段重複',
        error: {
          code: "E006_SCHEDULE_CONFLICT"
        }
      };
    }

    try {
      const result = await db.query(
        `INSERT INTO schedules (user_id, title, description, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, title, description, start_time, end_time]
      );

      return {
        message: '活動建立成功',
        schedule: result.rows[0]
      };
    } catch (err) {
      console.error('Schedule creation error:', err);
      return {
        message: '功能異常',
        error: {
          code: "E010_SCHEDULE_SERVER"
        }
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

  static async updateSchedule(user_id, schedule_id, title, description, start_time, end_time) {
    try {
      // 確認該筆資料是否屬於此 user
      const { rows } = await db.query(
        'SELECT * FROM schedules WHERE id = $1 AND user_id = $2',
        [schedule_id, user_id]
      );

      if (rows.length === 0) {
        return {
          message: '找不到該行事曆或權限不足'
        };
      }

      const updated = await db.query(
        `UPDATE schedules 
         SET title = $1, description = $2, start_time = $3, end_time = $4 
         WHERE id = $5 
         RETURNING *`,
        [title, description, start_time, end_time, schedule_id]
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
      // 檢查該筆是否屬於 user 本人
      const { rows } = await db.query(
        'SELECT * FROM schedules WHERE id = $1 AND user_id = $2',
        [schedule_id, user_id]
      );

      if (rows.length === 0) {
        return {
          message: '找不到該行事曆或權限不足',
          error: {
            code: "007_NOT_FOUND"
          }
        }
          ;
      }

      await db.query('DELETE FROM schedules WHERE id = $1', [schedule_id]);

      return {
        message: '活動刪除成功',
      };
    } catch (err) {
      console.error('DeleteSchedule service error:', err);
      throw err;
    }
  }

}

module.exports = ScheduleService;
