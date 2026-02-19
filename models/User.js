const db = require('../db');

class User {
  static async findByEmailOrUsername(email, username, account) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2 OR account = $3',
      [email, username, account]
    );
    return result.rows[0];
  }

  static async findByAccount(account) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1 OR account = $1',
      [account]
    );
    return result.rows[0];
  }

  static async updatePassword(account, newPasswordHash) {
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 OR username = $2 OR account = $2',
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
