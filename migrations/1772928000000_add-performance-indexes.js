/**
 * Migration: 新增效能索引
 * 目的：10 萬並發下，常用查詢條件從全表掃描改為索引掃描
 *
 * 預期效益：
 *   - schedules 查詢（user_id + 時間範圍）：O(n) → O(log n)
 *   - users 登入查詢（account / email）：O(n) → O(log n)
 *   - participants 查詢（user_id + schedule_id）：O(n) → O(log n)
 */

exports.up = (pgm) => {
  // 行事曆查詢：WHERE user_id = $1 AND start_time >= $2 AND end_time <= $3
  pgm.createIndex('schedules', ['user_id', 'start_time'], {
    name: 'idx_schedules_user_id_start_time',
    ifNotExists: true,
  });
  pgm.createIndex('schedules', ['user_id', 'end_time'], {
    name: 'idx_schedules_user_id_end_time',
    ifNotExists: true,
  });

  // 用戶登入查詢：WHERE account = $1 OR email = $1
  pgm.createIndex('users', ['email'], {
    name: 'idx_users_email',
    ifNotExists: true,
  });
  pgm.createIndex('users', ['account'], {
    name: 'idx_users_account',
    ifNotExists: true,
  });

  // 搜尋使用者：WHERE username ILIKE $1 OR email ILIKE $1
  // pg_trgm 擴展支援 ILIKE 的 GIN 索引（需 CREATE EXTENSION pg_trgm）
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_username_trgm'
      ) THEN
        BEGIN
          CREATE EXTENSION IF NOT EXISTS pg_trgm;
          CREATE INDEX idx_users_username_trgm ON users USING gin (username gin_trgm_ops);
          CREATE INDEX idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
        EXCEPTION WHEN OTHERS THEN
          -- pg_trgm 不可用時跳過，ILIKE 退回一般掃描
          RAISE NOTICE 'pg_trgm not available, skipping trigram indexes';
        END;
      END IF;
    END $$;
  `);

  // 參加者查詢：WHERE user_id = $1 AND schedule_id = $2
  pgm.createIndex('participants', ['user_id', 'schedule_id'], {
    name: 'idx_participants_user_schedule',
    ifNotExists: true,
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('schedules', ['user_id', 'start_time'], { name: 'idx_schedules_user_id_start_time', ifExists: true });
  pgm.dropIndex('schedules', ['user_id', 'end_time'], { name: 'idx_schedules_user_id_end_time', ifExists: true });
  pgm.dropIndex('users', ['email'], { name: 'idx_users_email', ifExists: true });
  pgm.dropIndex('users', ['account'], { name: 'idx_users_account', ifExists: true });
  pgm.dropIndex('participants', ['user_id', 'schedule_id'], { name: 'idx_participants_user_schedule', ifExists: true });
  pgm.sql(`
    DROP INDEX IF EXISTS idx_users_username_trgm;
    DROP INDEX IF EXISTS idx_users_email_trgm;
  `);
};
