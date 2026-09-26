const db = require('../db');

const PUBLIC_COLS = 'id, email, username, account, role, is_active, created_at';

class User {
  static async findByEmailOrUsername(email, username, account) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2 OR account = $3',
      [email, username, account]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, email, username, account, password_hash, role, is_active FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByAccountOrEmail(identifier) {
    const result = await db.query(
      'SELECT * FROM users WHERE account = $1 OR email = $1',
      [identifier]
    );
    return result.rows[0];
  }

  static async updatePassword(account, newPasswordHash) {
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE account = $2',
      [newPasswordHash, account]
    );
  }

  static async updatePasswordById(id, newPasswordHash) {
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, id]
    );
  }

  static async create(email, username, account, passwordHash) {
    const result = await db.query(
      'INSERT INTO users (email, username, account, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, username, account, passwordHash]
    );
    return result.rows[0].id;
  }

  static async searchByKeyword(keyword, limit = 20) {
    const result = await db.query(
      'SELECT id, username, email FROM users WHERE username ILIKE $1 OR email ILIKE $1 LIMIT $2',
      [`%${keyword}%`, limit]
    );
    return result.rows;
  }

  // ── 管理（整套平台共用的 admin 身分）──
  static async listAll() {
    const result = await db.query(`SELECT ${PUBLIC_COLS} FROM users ORDER BY id`);
    return result.rows;
  }

  static async updateRole(id, role) {
    const result = await db.query(
      `UPDATE users SET role = $2 WHERE id = $1 RETURNING ${PUBLIC_COLS}`,
      [id, role]
    );
    return result.rows[0];
  }

  static async setActive(id, isActive) {
    const result = await db.query(
      `UPDATE users SET is_active = $2 WHERE id = $1 RETURNING ${PUBLIC_COLS}`,
      [id, isActive]
    );
    return result.rows[0];
  }

  static async deleteById(id) {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rowCount;
  }
}

module.exports = User;
