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

```bash
# 全部單元測試
npm test

# 分類執行
npm run test:services
npm run test:controllers
npm run test:http

# 負載測試
npm run test:load           # 認證流程
npm run test:load:schedule  # 行程查詢
npm run test:load:spike     # 峰值測試
npm run test:load:soak      # 浸泡測試
```

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
