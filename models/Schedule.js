const db = require('../db');

class Schedule {
    static async findEvent(userId, startTime, endTime, returnCol) {
        const result = await db.query(
            `
            SELECT ${returnCol} FROM schedules 
            WHERE user_id = $1 and  start_time > $2 and end_time < $3
            `,
            [userId, startTime, endTime]
        );
        return result.rows;
    }

    static async findEmptyEvent(userId, startTime, endTime) {
    }
}

module.exports = Schedule;
