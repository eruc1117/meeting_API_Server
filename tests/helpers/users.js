// 測試用：在測試庫建／刪使用者（直接寫 SQL，不走註冊 API，避免吃到註冊限流）
const bcrypt = require('bcrypt');
const db = require('../../db');

const PASSWORD = 'Password123';
let hashCache = null;

async function createUser({ account, username = account, email = `${account}@example.com`, role = 'user', is_active = true, password = PASSWORD }) {
  if (!hashCache) hashCache = await bcrypt.hash(PASSWORD, 4);
  const hash = password === PASSWORD ? hashCache : await bcrypt.hash(password, 4);
  await db.query('DELETE FROM users WHERE account = $1 OR email = $2', [account, email]);
  const { rows } = await db.query(
    'INSERT INTO users (email, username, account, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, username, account, role, is_active',
    [email, username, account, hash, role, is_active]
  );
  return rows[0];
}

async function deleteUsers(ids) {
  if (!ids.length) return;
  await db.query('DELETE FROM users WHERE id = ANY($1::int[])', [ids]);
}

module.exports = { createUser, deleteUsers, PASSWORD };
