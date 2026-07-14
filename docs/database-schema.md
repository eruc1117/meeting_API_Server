# Database Schema

> 最後更新：2026-04-05
> 資料庫：PostgreSQL
> Migration 工具：node-pg-migrate

---

## 資料表總覽

| 資料表 | 說明 |
|--------|------|
| `users` | 使用者帳號資料 |
| `groups` | 群組（聊天室） |
| `messages` | 聊天訊息 |
| `chat_room_members` | 聊天室成員 |
| `schedules` | 行程 / 活動 |
| `participants` | 活動參與者（含主辦人） |

### View

| View | 說明 |
|------|------|
| `public_schedules` | 公開活動（`is_public = TRUE` 的 schedules） |

---

## 關聯圖

```
users ──┬── messages (sender_id)
        ├── chat_room_members (user_id)
        ├── schedules (user_id)  ──── participants (schedule_id)
        └── participants (user_id)

groups ─┬── messages (chat_room_id)
        └── chat_room_members (chat_room_id)
```

---

## users

使用者基本帳號資訊。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `email` | varchar(255) | NOT NULL, UNIQUE | 電子郵件 |
| `username` | varchar(100) | NOT NULL, UNIQUE | 顯示名稱 |
| `account` | varchar(100) | NOT NULL, UNIQUE | 登入帳號 |
| `password_hash` | varchar(255) | NOT NULL | bcrypt 加密後的密碼 |
| `created_at` | timestamp | DEFAULT current_timestamp | 建立時間 |

**索引**

| 索引名稱 | 欄位 | 類型 | 用途 |
|----------|------|------|------|
| `idx_users_email` | `email` | B-tree | 登入查詢 |
| `idx_users_account` | `account` | B-tree | 登入查詢 |
| `idx_users_username_trgm` | `username` | GIN (pg_trgm) | ILIKE 模糊搜尋（需 pg_trgm extension） |
| `idx_users_email_trgm` | `email` | GIN (pg_trgm) | ILIKE 模糊搜尋（需 pg_trgm extension） |

---

## groups

群組 / 聊天室。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `name` | varchar(255) | NOT NULL | 群組名稱 |
| `created_at` | timestamp | DEFAULT current_timestamp | 建立時間 |

---

## messages

聊天室訊息紀錄。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `chat_room_id` | integer | FK → groups(id) ON DELETE CASCADE | 所屬聊天室 |
| `sender_id` | integer | FK → users(id) ON DELETE CASCADE | 發送者 |
| `content` | text | NOT NULL | 訊息內容 |
| `sent_at` | timestamp | DEFAULT current_timestamp | 發送時間 |

---

## chat_room_members

聊天室成員中介表。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `chat_room_id` | integer | FK → groups(id) ON DELETE CASCADE | 所屬聊天室 |
| `user_id` | integer | FK → users(id) ON DELETE CASCADE | 成員使用者 |
| `joined_at` | timestamp | DEFAULT current_timestamp | 加入時間 |

**Constraints**
- `UNIQUE(chat_room_id, user_id)` — 同一使用者不可重複加入同一聊天室

---

## schedules

使用者行程 / 活動。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `user_id` | integer | FK → users(id) ON DELETE CASCADE | 建立者 |
| `title` | varchar(255) | NOT NULL | 行程標題 |
| `description` | text | - | 行程描述 |
| `start_time` | timestamp | NOT NULL | 開始時間 |
| `end_time` | timestamp | NOT NULL | 結束時間 |
| `is_public` | boolean | NOT NULL, DEFAULT false | 是否公開 |
| `location` | varchar(255) | - | 活動地點（可為空） |
| `participants` | text | - | 參與人員文字欄位，多人以頓號分隔（可為空） |
| `created_at` | timestamp | DEFAULT current_timestamp | 建立時間 |
| `updated_at` | timestamp | DEFAULT current_timestamp | 最後更新時間 |

> `participants`（text 欄位）為非正規化的備用欄位，正規化的參與者資料請參考 `participants` 資料表。

**索引**

| 索引名稱 | 欄位 | 類型 | 用途 |
|----------|------|------|------|
| `idx_schedules_user_id_start_time` | `(user_id, start_time)` | B-tree | 查詢用戶時間範圍內的行程 |
| `idx_schedules_user_id_end_time` | `(user_id, end_time)` | B-tree | 查詢用戶時間範圍內的行程 |

---

## participants

活動參與者中介表（含主辦人）。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `schedule_id` | integer | NOT NULL, FK → schedules(id) ON DELETE CASCADE | 所屬活動 |
| `user_id` | integer | NOT NULL, FK → users(id) ON DELETE CASCADE | 參與使用者 |
| `role` | varchar(50) | NOT NULL, DEFAULT 'participant' | 角色：`host` / `participant` |
| `joined_at` | timestamp | NOT NULL | 加入時間 |
| `leave_at` | timestamp | - | 離開時間（NULL 表示仍在其中） |

**索引**

| 索引名稱 | 欄位 | 類型 | 用途 |
|----------|------|------|------|
| `idx_participants_user_schedule` | `(user_id, schedule_id)` | B-tree | 查詢使用者參與的活動 |

---

## public_schedules（View）

篩選 `schedules` 中 `is_public = TRUE` 的資料列。

```sql
SELECT id, user_id, title, description, start_time, end_time, created_at, updated_at
FROM schedules
WHERE is_public = TRUE
```

---

## 連線池設定（`db/index.js`）

| 參數 | 值 | 說明 |
|------|----|------|
| `max` | 20（可由 `DB_POOL_MAX` env 覆蓋） | 每個 Node 進程最大連線數 |
| `idleTimeoutMillis` | 30000 ms | 閒置連線自動釋放時間 |
| `connectionTimeoutMillis` | 5000 ms | 等待可用連線的最長時間 |

> PM2 以 cluster mode 啟動時，總連線數 = 進程數 × `DB_POOL_MAX`。
> 搭配 PgBouncer 時建議將 `DB_POOL_MAX` 調低至 5~10。

---

## Migration 歷程

| 檔案 | 日期 | 內容 |
|------|------|------|
| `1747578778287_my-first-migration.js` | 2025-05 | 建立 `users`、`groups`、`messages`、`chat_room_members`、`schedules` |
| `1748099950541_user-table-edit.js` | 2025-05 | `users` 新增 `account` 欄位 |
| `1757824178601_add-eventMember-table.js` | 2025-09 | `schedules` 新增 `is_public`；建立 `public_schedules` View；建立 `participants` 表 |
| `1772236800000_add-location-participants-to-schedules.js` | 2026-02 | `schedules` 新增 `location`、`participants`（text）欄位 |
| `1772928000000_add-performance-indexes.js` | 2026-03 | 新增 7 個效能索引（schedules / users / participants） |

### 執行 Migration

```bash
# 套用所有未執行的 migration
npm run migrate:up

# 回滾最後一筆
npm run migrate:down
```
