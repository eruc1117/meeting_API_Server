const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // 每個 Node 進程最大連線數（搭配 PgBouncer 使用時可調低為 5~10）
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  // 連線閒置超過此時間自動釋放
  idleTimeoutMillis: 30000,
  // 等待可用連線的最長時間，超時拋出錯誤而非無限等待
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err.message);
});

module.exports = pool;
