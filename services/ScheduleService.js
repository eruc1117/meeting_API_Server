const db = require('../db');
const validator = require("../utils/validator");
const Schedule = require("../models/Schedule");

class ScheduleService {
  static async createSchedule(user_id, title, description, start_time, end_time, is_public, location, participants) {
    if (!user_id || !title || !start_time || !end_time) {
      return {
        message: '活動建立失敗，資料未提供',
        data: {},
        error: { code: 'E012_MISSING_FIELDS' }
      };
    }

    // M-01 修正：欄位長度驗證
    if (typeof title !== 'string' || title.trim().length === 0 || title.length > 255) {
      return {
        message: '活動建立失敗，標題長度需在 1~255 字元之間',
        data: {},
        error: { code: 'E011_DATA_TYPE_ERROR' }
      };
    }
    if (description && (typeof description !== 'string' || description.length > 5000)) {
      return {
        message: '活動建立失敗，描述長度不可超過 5000 字元',
        data: {},
        error: { code: 'E011_DATA_TYPE_ERROR' }
      };
    }

    const validateDateTimeSRe = validator.validateDateTime(start_time);
    const validateDateTimeERe = validator.validateDateTime(end_time);

    if (!validateDateTimeSRe || !validateDateTimeERe) {
      return {
        message: '活動建立失敗，資料格式錯誤',
        data: {},
        error: { code: 'E011_DATA_TYPE_ERROR' }
      };
    }

    const repeatChk = await Schedule.findEvent(user_id, start_time, end_time, 'id');

    if (repeatChk.length > 0) {
      return {
        message: '活動建立失敗，時段重複',
        data: {},
        error: { code: 'E006_SCHEDULE_CONFLICT' }
      };
    }

    try {
      const result = await db.query(
        `INSERT INTO schedules (user_id, title, description, start_time, end_time, is_public, location, participants)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [user_id, title, description, start_time, end_time, is_public, location ?? null, participants ?? null]
      );

      return {
        message: '活動建立成功',
        data: result.rows[0]
      };
    } catch (err) {
      console.error('Schedule creation error');
      return {
        message: '功能異常',
        data: {},
        error: { code: 'E010_SCHEDULE_SERVER' }
      };
    }
  }

  static async getSchedulesByUserId(user_id, start_time, end_time) {
    try {
      let queryText = 'SELECT * FROM schedules WHERE user_id = $1';
      const params = [user_id];

      if (start_time) {
        params.push(start_time);
        queryText += ` AND start_time >= $${params.length}`;
      }
      if (end_time) {
        params.push(end_time);
        queryText += ` AND end_time <= $${params.length}`;
      }

      queryText += ' ORDER BY start_time ASC';

      const result = await db.query(queryText, params);
      return {
        message: '活動查詢成功',
        data: { schedule: result.rows }
      };
    } catch (error) {
      // L-02 修正：統一回傳錯誤物件，不 throw
      console.error('getSchedulesByUserId error');
      return {
        message: '功能異常',
        data: {},
        error: { code: 'E010_SCHEDULE_SERVER' }
      };
    }
  }

  static async updateSchedule(user_id, schedule_id, title, description, start_time, end_time, is_public, location, participants) {
    try {
      const rows = await Schedule.findByIdAndUserId(schedule_id, user_id);

      if (rows.length === 0) {
        return {
          message: '活動更新失敗',
          data: {},
          error: { code: 'E007_NOT_FOUND' }
        };
      }

      await db.query(
        `UPDATE schedules
         SET title = $1, description = $2, start_time = $3, end_time = $4, is_public = $5,
             location = $6, participants = $7, updated_at = current_timestamp
         WHERE id = $8`,
        [title, description, start_time, end_time, is_public, location ?? null, participants ?? null, schedule_id]
      );

      return {
        message: '活動更新成功',
        data: {}
      };
    } catch (err) {
      console.error('UpdateSchedule service error');
      throw err;
    }
  }

  static async deleteSchedule(user_id, schedule_id) {
    try {
      const rows = await Schedule.findByIdAndUserId(schedule_id, user_id);

      if (rows.length === 0) {
        return {
          message: '活動刪除失敗',
          data: {},
          error: { code: 'E007_NOT_FOUND' }
        };
      }

      await db.query('DELETE FROM schedules WHERE id = $1', [schedule_id]);

      return {
        message: '活動刪除成功',
        data: {}
      };
    } catch (err) {
      console.error('DeleteSchedule service error');
      throw err;
    }
  }

  static async attendSchedule(user_id, schedule_id) {
    try {
      const { rows } = await db.query(
        'SELECT id FROM schedules WHERE id = $1 AND is_public = true',
        [schedule_id]
      );

      if (rows.length === 0) {
        return {
          message: '活動參加失敗，活動不存在或已關閉',
          data: {},
          error: { code: 'E007_NOT_FOUND' }
        };
      }

      await db.query(
        'INSERT INTO participants (user_id, schedule_id, joined_at) VALUES ($1, $2, NOW())',
        [user_id, schedule_id]
      );

      return {
        message: '活動參加成功',
        data: {}
      };
    } catch (err) {
      console.error('attendSchedule error');
      throw err;
    }
  }

  static async unattendSchedule(user_id, schedule_id) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM participants WHERE user_id = $1 AND schedule_id = $2',
        [user_id, schedule_id]
      );

      if (rows.length === 0) {
        return {
          message: '活動退出失敗，使用者未參加該活動',
          data: {},
          error: { code: 'E007_NOT_FOUND' }
        };
      }

      await db.query(
        'DELETE FROM participants WHERE user_id = $1 AND schedule_id = $2',
        [user_id, schedule_id]
      );

      return {
        message: '活動退出成功',
        data: {}
      };
    } catch (err) {
      console.error('unattendSchedule error');
      throw err;
    }
  }
}

module.exports = ScheduleService;
