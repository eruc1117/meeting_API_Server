# 系統規格書

> 最後更新：2026-02-28

---

## 1. 專案概述

本系統為一個行事曆協作平台的後端服務，提供使用者帳號管理、個人行事曆 CRUD、公開活動參加/退出，以及群組聊天室功能。

- **Runtime**：Node.js
- **Framework**：Express
- **Database**：PostgreSQL（透過 node-pg-migrate 管理 Schema）
- **認證**：JWT（Bearer Token）

---

## 2. 系統架構

```
client
  │
  ▼
Express Router
  │
  ├── middlewares/        JWT 驗證、IP 白名單
  │
  ├── controllers/        接收 req、呼叫 Service、回傳 res
  │
  ├── services/           商業邏輯、資料驗證
  │
  ├── models/             封裝常用 SQL 查詢
  │
  └── db/                 PostgreSQL 連線池
```

### 統一回應格式

```json
{
  "message": "說明文字",
  "data": {},
  "error": {}
}
```

- 成功時 `error` 為空物件 `{}`
- 失敗時 `data` 為空物件 `{}`，`error.code` 帶自定義錯誤代碼

---

## 3. 認證機制

- 登入/註冊以外的所有 API 需在 Header 帶入 JWT：
  ```
  Authorization: Bearer <JWT-TOKEN>
  ```
- Token 由登入或註冊成功後取得
- 驗證失敗回傳 `401 E004_UNAUTHORIZED`

---

## 4. 錯誤代碼

| Code | HTTP Status | 說明 |
|------|-------------|------|
| `E000_INTERNAL_ERROR` | 500 | 伺服器錯誤 |
| `E001_USER_EXISTS` | 409 | 註冊帳號已存在 |
| `E002_INVALID_EMAIL` | 400 | Email 格式錯誤 |
| `E003_INVALID_CREDENTIALS` | 401 | 帳號密碼錯誤 |
| `E004_UNAUTHORIZED` | 401 | 未登入 |
| `E005_FORBIDDEN` | 403 | 權限不足 |
| `E006_SCHEDULE_CONFLICT` | 409 | 行事曆時段重疊 |
| `E007_NOT_FOUND` | 404 | 資源不存在 |
| `E008_ACCOUNT_NOT_EXIST` | 404 | 帳號不存在 |
| `E009_PASSWORD_NOT_SAME` | 400 | 密碼與確認密碼不同 |
| `E010_SCHEDULE_SERVER` | 500 | 行事曆功能異常 |
| `E011_DATA_TYPE_ERROR` | 400 | 資料格式錯誤 |
| `E012_MISSING_FIELDS` | 400 | 必填欄位缺失 |

---

## 5. API 端點總覽

### 5.1 帳號與認證

| 方法 | 路徑 | 說明 | 需要 JWT |
|------|------|------|----------|
| POST | `/api/auth/register` | 註冊 | 否 |
| POST | `/api/auth/login` | 登入 | 否 |
| PUT | `/api/auth/updatePassword` | 更新密碼 | 是 |
| GET | `/api/user/info?id=` | 取得使用者資料 | 是 |

### 5.2 行事曆

| 方法 | 路徑 | 說明 | 需要 JWT |
|------|------|------|----------|
| POST | `/api/schedules` | 建立活動 | 是 |
| POST | `/api/schedules/query` | 查詢活動列表（user_id 必填，時間範圍選填） | 是 |
| PUT | `/api/schedules/:id` | 更新活動 | 是 |
| DELETE | `/api/schedules/:id` | 刪除活動 | 是 |
| POST | `/api/schedules/attend/:id` | 參加公開活動 | 是 |
| DELETE | `/api/schedules/attend/:id` | 退出公開活動 | 是 |

### 5.3 聊天室（規劃中）

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/groups` | 建立聊天室 |
| POST | `/api/messages` | 發送訊息 |

---

## 6. 資料模型

### 6.1 schedules（行程）

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | serial | — | 主鍵 |
| `user_id` | integer | 是 | 建立者（FK → users） |
| `title` | varchar(255) | 是 | 標題 |
| `description` | text | 否 | 內容描述 |
| `start_time` | timestamp | 是 | 開始時間（ISO 格式） |
| `end_time` | timestamp | 是 | 結束時間（ISO 格式） |
| `is_public` | boolean | 是 | 是否公開，預設 `false` |
| `location` | varchar(255) | 否 | 地點 |
| `participants` | text | 否 | 參與人員，多人用頓號分隔 |
| `created_at` | timestamp | — | 建立時間 |
| `updated_at` | timestamp | — | 最後更新時間 |

### 6.2 users（使用者）

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | serial | — | 主鍵 |
| `email` | varchar(255) | 是 | 電子郵件（唯一） |
| `username` | varchar(100) | 是 | 顯示名稱（唯一） |
| `account` | varchar(100) | 是 | 登入帳號（唯一） |
| `password_hash` | varchar(255) | 是 | 加密密碼 |
| `created_at` | timestamp | — | 建立時間 |

### 6.3 participants（活動參與者）

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | serial | — | 主鍵 |
| `schedule_id` | integer | 是 | FK → schedules |
| `user_id` | integer | 是 | FK → users |
| `role` | varchar(50) | 是 | `host` / `participant` |
| `joined_at` | timestamp | 是 | 加入時間 |
| `leave_at` | timestamp | 否 | 離開時間 |

---

## 7. 商業規則

### 行事曆

- 建立/更新活動時，若與該使用者現有活動時段重疊，回傳 `E006_SCHEDULE_CONFLICT`
- 時間欄位需符合 ISO 格式，否則回傳 `E011_DATA_TYPE_ERROR`
- `location`、`participants` 為選填；未提供時存入 `NULL`，前端應判斷空值後決定是否顯示
- `is_public = true` 的活動可被其他使用者參加（寫入 `participants` 表）；`is_public = false` 時參加請求回傳 `E007_NOT_FOUND`
- 使用者只能更新/刪除自己建立的活動
- 查詢活動（`POST /api/schedules/query`）以 JSON Body 傳入 `user_id`（必填）、`start_time`、`end_time`（選填，ISO 格式）；有傳入時間時篩選 `start_time >= 起始` 及 `end_time <= 結束`，未傳入則回傳該使用者所有活動

### 帳號

- 使用者只能查詢與自身 JWT id 相符的個人資料，否則回傳 `E005_FORBIDDEN`
- 密碼以 hash 儲存，不明文回傳

---

## 8. 前後端欄位對應（行事曆）

| 後端欄位 | 前端欄位（EventData） | 說明 |
|----------|----------------------|------|
| `id` | `Id` | |
| `title` | `title` | |
| `description` | `content` | |
| `start_time` | `startTime` | ISO 格式 |
| `end_time` | `endTime` | ISO 格式 |
| `is_public` | `isPublic` | true = 藍色，false = 綠色 |
| `location` | `location` | 空值時彈窗不顯示該列 |
| `participants` | `participants` | 空值時彈窗不顯示該列 |

---

## 9. 資料庫 Migration 歷程

| 檔案 | 異動內容 |
|------|----------|
| `1747578778287_my-first-migration.js` | 建立 `users`、`groups`、`messages`、`chat_room_members`、`schedules` |
| `1748099950541_user-table-edit.js` | `users` 新增 `account` 欄位 |
| `1757824178601_add-eventMember-table.js` | `schedules` 新增 `is_public`；建立 `public_schedules` View；建立 `participants` 表 |
| `1772236800000_add-location-participants-to-schedules.js` | `schedules` 新增 `location`、`participants` |
