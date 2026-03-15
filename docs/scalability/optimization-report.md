# 優化實作報告 — 2026-03-08

參考文件：`AI/scalability-100k/優化方向分析.md`

---

## 實作項目總覽

| 優先 | 項目 | 狀態 |
|------|------|------|
| P0 | IP 白名單移除（昨日已完成） | ✅ 完成 |
| P0 | PM2 多進程設定 | ✅ 完成（`ecosystem.config.js`） |
| P0 | DB Pool 參數設定 | ✅ 完成（`db/index.js`） |
| P1 | Logger 改用 pino（非同步寫入） | ✅ 完成（`middlewares/logger.js`） |
| P1 | Rate Limit 分層重構 | ✅ 完成（`app.js` + `routes/auth/auth.js`） |
| P1 | DB 索引建立（migration） | ✅ 完成（`migrations/1772928000000_...`） |
| 測試 | 負載測試腳本 + HTML 報告產生器 | ✅ 完成（`tests/load/`） |

---

## 一、DB Pool 設定（`db/index.js`）

### 修改內容
```diff
 const pool = new Pool({
   host: ..., port: ..., database: ..., user: ..., password: ...,
+  max: parseInt(process.env.DB_POOL_MAX) || 20,
+  idleTimeoutMillis: 30000,
+  connectionTimeoutMillis: 5000,
 });
+pool.on('error', (err) => { console.error('Unexpected DB pool error', err.message); });
```

### 說明
- `max: 20`：每個 Node 進程最多維持 20 條 DB 連線。PM2 啟 8 個進程 → 最多 160 條，在 PostgreSQL max_connections 範圍內（建議調到 200）。
- `idleTimeoutMillis: 30000`：閒置超過 30 秒的連線自動釋放，避免資源浪費。
- `connectionTimeoutMillis: 5000`：等待可用連線超過 5 秒就拋錯（而非無限等待），讓錯誤快速浮現。
- `pool.on('error')`：捕捉意外的連線錯誤，避免 uncaught exception 讓進程崩潰。
- `DB_POOL_MAX` 可透過環境變數控制，搭配 PgBouncer 時可調低至 5~10。

---

## 二、Logger 改用 pino（`middlewares/logger.js`）

### 問題
舊版每次請求：
1. `jwt.verify`（CPU 密集，重複驗簽）
2. `fs.appendFile`（同步磁碟 I/O 呼叫）

### 修改內容
```diff
- const jwt = require('jsonwebtoken');
- fs.appendFile(logFile, line + '\n', ...)   // 同步 I/O
- const decoded = jwt.verify(token, SECRET)   // 重複驗簽

+ const pino = require('pino');
+ const fileStream = pino.destination({ dest: '...', sync: false }); // 非同步批次寫入
+ const decoded = jwt.decode(token);           // 不驗簽，僅解析 payload 供記錄用
```

### 說明
- **pino** 是 Node.js 效能最高的 logger（比 winston 快 5x，比 console.log 快 3x），底層使用非同步 stream 批次寫入磁碟。
- 改用 `jwt.decode`（不驗章）：Logger 的目的是記錄 user_id，不需要安全驗證——驗證由 `authMiddleware` 的 `jwt.verify` 負責，不重複。
- 開發環境自動啟用 `pino-pretty`（彩色格式化輸出到 stdout）；生產環境寫入 `logs/api.log`（JSON 格式，方便 log aggregator 解析）。

---

## 三、Rate Limit 分層重構

### 舊版
```
全域：100 次 / 15 分鐘 / IP = 6.67 次/分鐘（極嚴）
Auth：10 次 / 15 分鐘 / IP（防暴力，OK）
```

### 新版（`app.js` + `routes/auth/auth.js`）
```
全域 DDoS 防護：300 次 / 分鐘 / IP  （提升 45 倍，正常用戶不會觸發）
登入限制：       5 次 / 分鐘 / IP    （防暴力破解，短視窗快速鎖定）
註冊限制：       10 次 / 小時 / IP   （防大量假帳號）
```

### 說明
- 原本 100/15min 幾乎讓任何正常用戶都會觸發，現在改為 300/min 留下充裕空間。
- Login/Register 分開設限：Login 需要比 Register 更嚴，因為暴力破解的目標是 Login。
- 待 Redis 就緒後，在 `store` 選項加入 `rate-limit-redis`，即可讓多進程共享計數。

---

## 四、DB 索引（`migrations/1772928000000_add-performance-indexes.js`）

### 建立的索引

| 索引名稱 | 資料表 | 欄位 | 用途 |
|----------|--------|------|------|
| `idx_schedules_user_id_start_time` | schedules | `(user_id, start_time)` | 查詢用戶時間範圍內的行程 |
| `idx_schedules_user_id_end_time` | schedules | `(user_id, end_time)` | 同上（end_time 條件） |
| `idx_users_email` | users | `email` | 登入 / 搜尋查詢 |
| `idx_users_account` | users | `account` | 登入查詢 |
| `idx_users_username_trgm` | users | `username` (GIN) | ILIKE 模糊搜尋（pg_trgm） |
| `idx_users_email_trgm` | users | `email` (GIN) | ILIKE 模糊搜尋（pg_trgm） |
| `idx_participants_user_schedule` | participants | `(user_id, schedule_id)` | 參加/退出活動查詢 |

### 執行方式
```bash
npm run migrate:up
```

---

## 五、PM2 多進程（`ecosystem.config.js`）

```bash
# 安裝 PM2（全域）
npm install -g pm2

# 啟動（自動偵測 CPU 核心數）
npm run start:pm2

# 生產環境
npm run start:pm2:prod

# 零停機重啟（rolling reload）
pm2 reload ecosystem.config.js

# 即時監控
pm2 monit
```

### 關鍵設定
- `instances: 'max'` + `exec_mode: 'cluster'`：利用所有 CPU 核心
- `UV_THREADPOOL_SIZE: 16`：提高 libuv thread pool，讓 bcrypt 等 CPU-bound 操作不擠佔主線程
- `max_memory_restart: '512M'`：記憶體洩漏自動重啟保護
- `DB_POOL_MAX: 10`（多進程模式下每進程調低，總連線數 = 進程數 × 10）

---

## 六、負載測試系統（`tests/load/`）

### 檔案結構
```
tests/load/
├── run-test.js          主執行器（4 種情境）
├── generate-report.js   HTML 報告產生器
├── scenarios/
│   ├── auth.js          登入情境設定
│   └── schedule.js      行事曆情境 + Token 取得
└── reports/             測試結果輸出（自動建立）
    ├── auth-XXXX.json
    └── auth-XXXX.html   ← 瀏覽器可開啟的完整報告
```

### 使用方式
```bash
# 登入壓測（預設 50 並發、20 秒）
npm run test:load

# 行事曆查詢壓測
npm run test:load:schedule

# 突發峰值測試
npm run test:load:spike

# 浸泡測試（2 分鐘）
npm run test:load:soak

# 自訂參數
CONNECTIONS=200 DURATION=60 npm run test:load

# 指定帳號密碼
TEST_ACCOUNT=myuser@test.com TEST_PASSWORD=MyPass1 npm run test:load:schedule
```

### 報告內容
- **概覽卡片**：總請求數、平均 RPS、並發連線數、測試時長
- **延遲分佈**：min / mean / p50 / p75 / p90 / p99 / max / stddev
- **請求統計**：錯誤數、錯誤率、Non-2xx、Timeout、吞吐量
- **閾值判斷**：p99 < 1000ms ✓/✗、錯誤率 < 5% ✓/✗

報告自動儲存至 `tests/load/reports/`，格式：`{scenario}-{timestamp}.html`

---

## 測試結果（單元測試）

```
Test Suites: 6 passed, 6 total
Tests:       64 passed, 64 total
```

---

## 待辦（未實作，需 infra 配合）

| 項目 | 說明 |
|------|------|
| PgBouncer | 安裝後將 `DB_POOL_MAX` 調低至 5，由 PgBouncer 統一管理連線 |
| Redis Rate Limit store | `npm install rate-limit-redis`，在 `app.js` 加入 `store` 選項 |
| Redis 快取（user info） | `UserService.getUserInfo` 加 TTL 5 分鐘快取 |
| 讀寫分離 | `db/index.js` 新增 readPool 指向 Replica |
| Schedule 衝突 DB Constraint | `EXCLUDE USING gist (user_id WITH =, tsrange(...) WITH &&)` |
