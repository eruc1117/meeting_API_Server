const db = require('../db');

class ScheduleService {
  static async createSchedule(user_id, title, description, start_time, end_time) {
    ;
    if (!user_id || !title || !start_time || !end_time) {
      return {
        status: 400,
        body: { message: 'Missing required fields' }
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
        status: 201,
        body: {
          message: 'Event created',
          schedule: result.rows[0]
        }
      };
    } catch (err) {
      console.error('Schedule creation error:', err);
      return {
        status: 400,
        body: { message: '伺服器回傳錯誤訊息' }
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
          status: 404,
          body: { message: '找不到該行事曆或權限不足' }
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
        status: 200,
        body: {
          message: 'Schedule updated',
          schedule: updated.rows[0]
        }
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
          status: 404,
          body: { message: '找不到該行事曆或權限不足' },
        };
      }

      await db.query('DELETE FROM schedules WHERE id = $1', [schedule_id]);

      return {
        status: 200,
        body: { message: 'Schedule deleted' },
      };
    } catch (err) {
      console.error('DeleteSchedule service error:', err);
      throw err;
    }
  }

}

module.exports = ScheduleService;
