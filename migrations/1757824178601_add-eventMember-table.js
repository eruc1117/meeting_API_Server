exports.up = (pgm) => {
    // 1. schedules 新增欄位
    pgm.addColumn('schedules', {
        is_public: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
    });

    // 2. 建立 View，顯示公開的活動
    pgm.createView(
        'public_schedules',
        {},
        `
      SELECT id, user_id, title, description, start_time, end_time, created_at, updated_at
      FROM schedules
      WHERE is_public = TRUE
    `
    );

    // 3. 建立 participants 表，紀錄活動人員（含主辦人）
    pgm.createTable('participants', {
        id: 'id',
        schedule_id: {
            type: 'integer',
            notNull: true,
            references: 'schedules(id)',
            onDelete: 'CASCADE',
        },
        user_id: {
            type: 'integer',
            notNull: true,
            references: 'users(id)',
            onDelete: 'CASCADE',
        },
        role: {
            type: 'varchar(50)',
            notNull: true,
            default: 'participant', // 其他值可為 'host'
        },
        joined_at: {
            type: 'timestamp',
            notNull: true,
        },
        leave_at: {
            type: 'timestamp',
            notNull: false,
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable('participants');
    pgm.dropView('public_schedules');
    pgm.dropColumn('schedules', 'is_public');
};
