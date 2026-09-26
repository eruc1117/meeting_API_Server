# Meeting Calendar API Server

行事曆排程系統後端服務，提供使用者認證、行程管理與多人協作 API。

**前端專案：** [meeting_front_end](https://github.com/eruc1117/meeting_front_end)

---

## 技術棧

| 類別 | 技術 |
|------|------|
| 執行環境 | Node.js + Express 5 |
| 資料庫 | PostgreSQL（pg Pool） |
| 認證 | JWT（jsonwebtoken）+ bcrypt |
| 日誌 | pino（非同步寫入） |
| 進程管理 | PM2 Cluster Mode |
| 限流 | express-rate-limit |
| 安全 | helmet、CORS |
| 測試 | Jest + Supertest + autocannon |

---

## 專案結構

```
├── controllers/        # HTTP 請求處理層
├── services/           # 業務邏輯層
├── models/             # 資料庫查詢層
├── routes/             # Express 路由
│   ├── auth/           # 認證相關路由
│   └── users/          # 使用者相關路由
├── middlewares/        # 中介層（logger、IP 白名單）
├── migrations/         # 資料庫 schema 變更腳本
├── tests/
│   ├── controllers/    # Controller 單元測試
│   ├── services/       # Service 單元測試
│   ├── http/           # HTTP 整合測試
│   └── load/           # 負載測試腳本
├── docs/               # 文件
│   ├── API.md
│   ├── database-schema.md
│   ├── error_Code.md
│   └── scalability/    # 效能優化分析與報告
├── ecosystem.config.js # PM2 設定
└── server.js
```

---

## API 端點總覽

### 認證（`/api/auth`）

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 註冊新用戶 |
| POST | `/api/auth/login` | 用戶登入，回傳 JWT |
| PUT | `/api/auth/updatePassword` | 更新密碼（需 JWT） |

### 使用者（`/api/user`、`/api/users`）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/user/info` | 取得使用者資料（需 JWT） |
| GET | `/api/users/search?q=` | 模糊搜尋使用者（需 JWT） |

### 行程（`/api/schedules`）

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/schedules/create` | 建立行程（需 JWT） |
| PUT | `/api/schedules/update/:id` | 更新行程（需 JWT） |
| DELETE | `/api/schedules/delete/:id` | 刪除行程（需 JWT） |
| POST | `/api/schedules/query` | 查詢時間範圍內行程（需 JWT） |

### 平台管理（`/api/admin`，需 admin）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/admin/users` | 列出所有使用者（角色、狀態） |
| PUT | `/api/admin/users/:id` | 改角色 `role: user|admin` 或停用 `is_active` |
| DELETE | `/api/admin/users/:id` | 刪除使用者 |

**整套平台只有一種 admin**：`users.role` 寫進登入 JWT，行事曆的管理 API 與股票系統都讀它。
第一個 admin 由 `.env` 的 `ADMIN_ACCOUNTS`（帳號或 email，逗號分隔）在註冊／登入時自動升級。

### 股票（`/api/stock`，代理到 erucMoney）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/stock/health` | 上游股票服務（erucMoney）是否在線（需 JWT） |
| GET | `/api/stock/stocks?tracked=true` | 追蹤股票最新行情（需 JWT） |
| GET | `/api/stock/stocks/:id/prices?days=` | 個股行情（需 JWT） |
| GET | `/api/stock/forecast/weekly` | 每週全模型預測（需 JWT） |
| GET | `/api/stock/holdings` | 使用者自己在股票系統的持股（需 JWT；單一登入） |
| POST | `/api/stock/holdings/trades` | 記一筆交易（body 原樣轉上游） |
| ANY | `/api/stock/<上游路徑>` | 其餘全部原樣轉：方法、query、body（`/auth/login`、`/auth/change-password` 除外） |

**登入只有一套**：這裡簽的 JWT（payload 含 `id`、`username`）直接轉給 erucMoney，它用同一把密鑰驗證，
第一次看到某個帳號會自動建立對應使用者；所以 `/api/stock/holdings` 看到的是使用者自己的持股。
統一前端把 erucMoney 儀表板的全部功能併進來了（Iteration 44），所以代理轉發所有方法與 body；
權限由上游判斷：`/crawler`、`/models`、`/data`、`/auth/users` 在 erucMoney 要 admin，一般使用者會拿到 403。

詳細請求／回應格式請參考 [docs/API.md](docs/API.md)。

---

## 快速開始

### 環境需求
- Node.js 18+
- PostgreSQL 14+

### 安裝

```bash
npm install
```

### 環境變數

建立 `.env` 檔案：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
DB_POOL_MAX=20

JWT_SECRET=your_jwt_secret

PORT=3000
NODE_ENV=development

# 股票儀表板唯讀代理（/api/stock/*）：上游是 erucMoney（https://github.com/eruc1117/erucMoney）的 Node API
# 單一登入：erucMoney 的 JWT_SECRET 必須設成和這裡的 SECRET 相同，使用者的 token 才能原樣轉過去
STOCK_API_URL=https://api.erucmoney.com
# 整套平台共用的 admin：這些帳號（account 或 email，逗號分隔）註冊／登入時自動升成 admin
ADMIN_ACCOUNTS=
```

### 啟動

```bash
# 開發模式（nodemon）
npm run dev

# 一般啟動
npm start

# PM2 多進程（正式環境）
npm run start:pm2:prod
```

### 資料庫 Migration

```bash
npm run migrate:up
```

---

## 測試

四層：**單元**（services、middlewares、controllers、validator，全部 mock，不碰 DB）→ **API 整合**（`tests/http/`、`tests/db/`，supertest 打真的測試資料庫）→ 端到端（前端 repo 的 Playwright）→ 部署冒煙（erucMoney `Deploy/`）。

### 測試資料庫

測試**只會打 `*_test` 資料庫**，設定在 `.env.test`（可 commit，沒有密碼）：

- `tests/setup-env.js`：每個測試檔載入前先讀 `.env`（拿本機的 DB 連線與密碼），再用 `.env.test` 覆蓋，並檢查 `DB_NAME` 以 `_test` 結尾，否則直接拋錯。
- `tests/global-setup.js`：跑全部測試前建立 `Schedule_test`（不存在時 `CREATE DATABASE`）並用 node-pg-migrate 遷到最新。
- 本機不用手動建庫；密碼沿用 `.env` 的 `DB_PASSWORD`，或另外設環境變數 `TEST_DB_PASSWORD`。CI 由 workflow 提供 `DB_PASSWORD`。
- 手動建（權限不夠時）：`CREATE DATABASE "Schedule_test";` 然後 `DATABASE_URL=postgres://postgres:<密碼>@localhost:5432/Schedule_test npm run migrate:up`。

### 執行

```bash
npm test                 # 全部（--runInBand：http 測試共用同一個測試庫，不平行）
npm run test:unit        # 只跑單元（秒級）
npm run test:http        # 只跑 API 整合
npm run test:coverage    # 含覆蓋率；statements 低於 75% 會失敗（jest.config.js）

# 負載測試（另起服務後）
npm run test:load           # 認證流程
npm run test:load:schedule  # 行程查詢
npm run test:load:spike     # 峰值測試
npm run test:load:soak      # 浸泡測試
```

### 功能對應

| 功能 | 檔案 |
|------|------|
| 註冊、登入、改密碼、role、ADMIN_ACCOUNTS、停用帳號 | `tests/http/auth.test.js`、`tests/services/AuthService.test.js` |
| 平台使用者管理（`/api/admin/users`） | `tests/http/admin.test.js`、`tests/services/AdminService.test.js`、`tests/middlewares/adminMiddleware.test.js` |
| 行程 CRUD、查詢、參與 | `tests/http/schedule.test.js`、`tests/services/ScheduleService.test.js` |
| 使用者資料、搜尋 | `tests/http/user.test.js`、`tests/services/UserService.test.js` |
| 股票代理（`/api/stock/*`） | `tests/http/stock-proxy.test.js`（假上游在 `tests/helpers/stock-upstream.js`）、`tests/services/StockService.test.js` |
| CORS、body 上限、登入限流、helmet | `tests/http/security.test.js`、`tests/middlewares/ipWhitelist.test.js` |
| 資料庫連線與 migration 可逆 | `tests/db/db.test.js`、`tests/db/migrations.test.js` |

helper：`tests/helpers/tokens.js`（直接簽 JWT）、`tests/helpers/users.js`（用 SQL 建／刪測試使用者，不吃註冊限流）。
日期相關案例一律用相對日期（`validateDateTime` 只接受一年前～兩年後），不要寫死年份。

CI：`.github/workflows/test.yml`（push 與 PR；postgres:16 服務 + `npm run test:coverage`）。

---

## 效能設計

針對 10 萬並發目標進行優化，詳見 [docs/scalability/](docs/scalability/)。

| 層級 | 措施 |
|------|------|
| 進程 | PM2 Cluster（`instances: max`，充分利用多核） |
| 資料庫 | Pool max:20、複合索引（`user_id + start_time`）、GIN 索引（username 模糊搜尋） |
| 日誌 | pino 非同步寫入，`jwt.decode` 取代重複 `jwt.verify` |
| 限流 | 全域 300/min、登入 5/min、註冊 10/hr |

---

## 文件

| 文件 | 說明 |
|------|------|
| [docs/API.md](docs/API.md) | API 規格與請求／回應範例 |
| [docs/database-schema.md](docs/database-schema.md) | 資料庫 Schema |
| [docs/error_Code.md](docs/error_Code.md) | 統一錯誤碼定義 |
| [docs/scalability/優化方向分析.md](docs/scalability/優化方向分析.md) | P0~P3 瓶頸分析與修法 |
| [docs/scalability/optimization-report.md](docs/scalability/optimization-report.md) | 優化實作報告 |
