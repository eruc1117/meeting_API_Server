# Database Schema

> 最後更新：2026-02-28

---

## 資料表總覽

| 資料表 | 說明 |
|--------|------|
| `users` | 使用者帳號資料 |
| `groups` | 群組（聊天室） |
| `messages` | 聊天訊息 |
| `chat_room_members` | 聊天室成員 |
| `schedules` | 行程 / 活動 |
| `participants` | 活動參與者 |

### View

| View | 說明 |
|------|------|
| `public_schedules` | 公開活動（`is_public = TRUE` 的 schedules） |

---

## users

使用者基本帳號資訊。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `email` | varchar(255) | NOT NULL, UNIQUE | 電子郵件 |
| `username` | varchar(100) | NOT NULL, UNIQUE | 顯示名稱 |
| `account` | varchar(100) | NOT NULL, UNIQUE | 登入帳號（後來新增） |
| `password_hash` | varchar(255) | NOT NULL | 加密後的密碼 |
| `created_at` | timestamp | DEFAULT current_timestamp | 建立時間 |

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
| `chat_room_id` | integer | FK → groups(id), ON DELETE CASCADE | 所屬聊天室 |
| `sender_id` | integer | FK → users(id), ON DELETE CASCADE | 發送者 |
| `content` | text | NOT NULL | 訊息內容 |
| `sent_at` | timestamp | DEFAULT current_timestamp | 發送時間 |

---

## chat_room_members

聊天室成員中介表。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `chat_room_id` | integer | FK → groups(id), ON DELETE CASCADE | 所屬聊天室 |
| `user_id` | integer | FK → users(id), ON DELETE CASCADE | 成員使用者 |
| `joined_at` | timestamp | DEFAULT current_timestamp | 加入時間 |

**Constraints**
- `UNIQUE(chat_room_id, user_id)` — 同一使用者不可重複加入同一聊天室

---

## schedules

使用者行程 / 活動。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `user_id` | integer | FK → users(id), ON DELETE CASCADE | 建立者 |
| `title` | varchar(255) | NOT NULL | 行程標題 |
| `description` | text | - | 行程描述 |
| `start_time` | timestamp | NOT NULL | 開始時間 |
| `end_time` | timestamp | NOT NULL | 結束時間 |
| `is_public` | boolean | NOT NULL, DEFAULT false | 是否公開 |
| `location` | varchar(255) | - | 活動地點（可為空） |
| `participants` | text | - | 參與人員，多人用頓號分隔（可為空） |
| `created_at` | timestamp | DEFAULT current_timestamp | 建立時間 |
| `updated_at` | timestamp | DEFAULT current_timestamp | 最後更新時間 |

---

## participants

活動參與者中介表（含主辦人）。

| 欄位 | 型別 | 限制 | 說明 |
|------|------|------|------|
| `id` | serial (PK) | NOT NULL | 主鍵，自動遞增 |
| `schedule_id` | integer | NOT NULL, FK → schedules(id), ON DELETE CASCADE | 所屬活動 |
| `user_id` | integer | NOT NULL, FK → users(id), ON DELETE CASCADE | 參與使用者 |
| `role` | varchar(50) | NOT NULL, DEFAULT 'participant' | 角色（`host` / `participant`） |
| `joined_at` | timestamp | NOT NULL | 加入時間 |
| `leave_at` | timestamp | - | 離開時間（可為 NULL） |

---

## public_schedules（View）

篩選 `schedules` 中 `is_public = TRUE` 的資料列。

| 欄位 | 來源 |
|------|------|
| `id` | schedules.id |
| `user_id` | schedules.user_id |
| `title` | schedules.title |
| `description` | schedules.description |
| `start_time` | schedules.start_time |
| `end_time` | schedules.end_time |
| `created_at` | schedules.created_at |
| `updated_at` | schedules.updated_at |

---

## Migration 歷程

| 檔案 | 內容 |
|------|------|
| `1747578778287_my-first-migration.js` | 建立 `users`、`groups`、`messages`、`chat_room_members`、`schedules` |
| `1748099950541_user-table-edit.js` | `users` 新增 `account` 欄位 |
| `1757824178601_add-eventMember-table.js` | `schedules` 新增 `is_public`；建立 `public_schedules` View；建立 `participants` 表 |
| `1772236800000_add-location-participants-to-schedules.js` | `schedules` 新增 `location`、`participants` 欄位 |
