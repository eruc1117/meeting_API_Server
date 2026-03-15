# 004 — 參與人員自動補全功能需要後端 API 支援

## 背景

spec 9.5 查詢活動（修改）要求：
> 參與人員，當使用者輸入名稱或是信箱時，顯示下拉選單，內容是名稱模糊比對的人員或信箱對應人員，以選取下拉選單的資料為主，要記錄參與人員 ID。

目前進階搜尋的「參與人員」欄位為純文字輸入，僅支援 client-side 文字比對，**無法**取得使用者 ID 或做真正的使用者搜尋。

---

## 需要新增的 API

### `GET /api/users/search`

| 項目 | 說明 |
|------|------|
| 方法 | GET |
| 路徑 | `/api/users/search` |
| 需要 JWT | 是 |
| Query Params | `q` — 搜尋關鍵字（名稱或信箱，最少 1 字元） |

**Request：**
```
GET /api/users/search?q=小明
Authorization: Bearer <token>
```

**Response（成功）：**
```json
{
  "message": "查詢成功",
  "data": {
    "users": [
      { "id": 1, "username": "小明", "email": "ming@example.com" },
      { "id": 5, "username": "小明2", "email": "ming2@example.com" }
    ]
  },
  "error": {}
}
```

**Response（失敗）：**
- `400 E012_MISSING_FIELDS` — `q` 未傳
- `401 E004_UNAUTHORIZED` — 未登入

---

## 前端需求

1. 「參與人員」輸入框：使用者輸入時 debounce 呼叫 `GET /api/users/search?q=<input>`
2. 顯示下拉選單，項目格式：`{username}（{email}）`
3. 使用者選取後，記錄選取的 `user_id`（一或多個）
4. 送出時 `participants` 欄位改為傳送 user_id 陣列（需確認後端 `schedules.participants` 欄位格式是否調整）

---

## 影響範圍

- 後端：新增 `GET /api/users/search` 端點
- 前端：`scheduleForm/index.tsx` 進階搜尋的參與人員欄位改為 autocomplete
- 若 `schedules.participants` 欄位格式從「頓號分隔字串」改為「user_id 陣列」，需同步更新 DB Schema 及前後端資料格式

---

## 日期

2026-03-07

## 狀態

⏳ 待規劃
