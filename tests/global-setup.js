// 整個測試流程開始前跑一次：建立測試資料庫（不存在時）、跑 migration 到最新。
// 連線資訊來自 .env.test（見 tests/setup-env.js）。
const path = require('path');
require('./setup-env');
const { Client } = require('pg');
const { runner } = require('node-pg-migrate');

module.exports = async () => {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
  const base = { host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD };

  // 1. 測試庫不存在就建（連到 postgres 系統庫）
  const admin = new Client({ ...base, database: 'postgres' });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (!rowCount) {
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`[test] 已建立測試資料庫 ${DB_NAME}`);
  }
  await admin.end();

  // 2. migration 到最新
  const dbClient = new Client({ ...base, database: DB_NAME });
  await dbClient.connect();
  await runner({
    dbClient,
    dir: path.join(__dirname, '..', 'migrations'),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    count: Infinity,
    log: () => {},
  });
  await dbClient.end();
};
