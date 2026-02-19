const db = require('../db');

class Schedule {
    static async findEvent(userId, startTime, endTime, returnCol) {
        const result = await db.query(
            `
            SELECT ${returnCol} FROM schedules
            WHERE user_id = $1 and  start_time >= $2 and end_time <= $3
            `,
            [userId, startTime, endTime]
        );
        return result.rows;
    }

    static async findByIdAndUserId(schedule_id, user_id) {
        const result = await db.query(
            'SELECT * FROM schedules WHERE id = $1 AND user_id = $2',
            [schedule_id, user_id]
        );
        return result.rows;
    }
}

module.exports = Schedule;
