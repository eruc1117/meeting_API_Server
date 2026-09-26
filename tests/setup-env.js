// 每個測試檔載入前執行：讀 .env（拿本機的 DB 連線）→ 再讀 .env.test 覆蓋 → 確認打的是測試資料庫。
// 各模組自己的 require('dotenv').config() 不會覆蓋已存在的環境變數，所以這裡先設的值會贏。
// .env.test 刻意不放 DB_PASSWORD：本機用 .env 的（或 TEST_DB_PASSWORD），CI 由 workflow 的環境變數提供。
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });
dotenv.config({ path: path.join(__dirname, '..', '.env.test'), override: true, quiet: true });
if (process.env.TEST_DB_PASSWORD) process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;

if (!/_test$/i.test(process.env.DB_NAME || '')) {
  throw new Error(`測試只能打 *_test 資料庫，現在是 DB_NAME=${process.env.DB_NAME}（檢查 .env.test）`);
}
