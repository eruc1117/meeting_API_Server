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

}

module.exports = ScheduleService;
