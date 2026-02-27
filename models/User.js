const db = require('../db');

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
      'SELECT id, email, username, account FROM users WHERE id = $1',
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

  static async create(email, username, account, passwordHash) {
    const result = await db.query(
      'INSERT INTO users (email, username, account, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, username, account, passwordHash]
    );
    return result.rows[0].id;
  }
}

module.exports = User;
