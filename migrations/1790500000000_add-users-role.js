/**
 * Migration: users 表新增 role 與 is_active（整套平台共用一種 admin 身分）
 * role：'user'（預設）或 'admin'。admin 可管理平台使用者，且這個角色會隨 JWT 帶到股票系統（erucMoney）。
 * is_active：停用的帳號不能登入。
 * 第一個 admin 由 .env 的 ADMIN_ACCOUNTS（帳號或 email，逗號分隔）在註冊／登入時自動升級。
 */
exports.up = (pgm) => {
  pgm.addColumns('users', {
    role: { type: 'varchar(20)', notNull: true, default: 'user' },
    is_active: { type: 'boolean', notNull: true, default: true },
  });
  pgm.addConstraint('users', 'users_role_check', { check: "role IN ('user', 'admin')" });
};

exports.down = (pgm) => {
  pgm.dropConstraint('users', 'users_role_check');
  pgm.dropColumns('users', ['role', 'is_active']);
};
