const db = require('../db');

class User {
  static async findByEmailOrUsername(email, username) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    return result.rows[0];
  }

  static async create(ID, email, username, passwordHash) {
    const result = await db.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [email, username, passwordHash]
    );
    return result.rows[0].id;
  }
}

module.exports = User;
