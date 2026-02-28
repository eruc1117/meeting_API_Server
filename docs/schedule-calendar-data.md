# 行事曆活動資料格式

## 前端資料模型（EventData）

```ts
interface EventData {
  Id:           string   // 活動 ID
  title:        string   // 活動主旨
  content:      string   // 活動內容
  startTime:    string   // 開始時間，ISO 格式：YYYY-MM-DDTHH:mm
  endTime:      string   // 結束時間，ISO 格式：YYYY-MM-DDTHH:mm
  isPublic:     boolean  // 是否公開（true = 公開藍色，false = 個人綠色）
  location:     string   // 活動地點（可為空）
  participants: string   // 參與人員（可為空，多人用頓號分隔）
}
```

---

## 後端 API 欄位對應

### 目前回傳（GET /api/schedules）

```json
{
  "id":          1,
  "title":       "Meeting with John",
  "description": "Discuss project details",
  "start_time":  "2025-05-08T09:00:00",
  "end_time":    "2025-05-08T10:00:00"
}
```

### 前端映射（SechduleContext.js）

| 後端欄位      | 前端欄位       | 備註            |
|-------------|--------------|----------------|
| `id`        | `Id`         |                |
| `title`     | `title`      |                |
| `description` | `content`  |                |
| `start_time` | `startTime` |                |
| `end_time`  | `endTime`    |                |
| `is_public` | `isPublic`   | **尚未實作**    |
| `location`  | `location`   | **尚未實作**    |
| `participants` | `participants` | **尚未實作** |

---

## 後端需新增欄位

| 欄位名稱       | 型別      | 說明                        |
|--------------|---------|-----------------------------|
| `is_public`  | boolean | 活動是否公開，預設 `false`    |
| `location`   | string  | 活動地點，可為空字串          |
| `participants` | string | 參與人員，可為空字串          |

### 建議 GET /api/schedules 完整回傳格式

```json
{
  "message": "活動查詢成功",
  "data": {
    "schedule": [
      {
        "id":           1,
        "user_id":      1,
        "title":        "部門會議",
        "description":  "討論 Q1 目標與 KPI 分配",
        "start_time":   "2026-02-05T10:00:00",
        "end_time":     "2026-02-05T11:00:00",
        "is_public":    true,
        "location":     "會議室 A",
        "participants": "小明、小美、老王",
        "created_at":   "2026-01-01T00:00:00"
      }
    ]
  },
  "error": {}
}
```

---

## 行事曆顯示規則

| 條件           | 顯示樣式              |
|--------------|---------------------|
| `isPublic: true`  | 淡藍色方塊（`#bfdfff`）|
| `isPublic: false` | 淡綠色方塊（`#bbf7c5`）|
| 格子下方 20%   | 保留空白，不放置活動   |
| 點擊活動方塊   | 彈出懸浮視窗顯示詳細資訊 |

---

## 彈窗顯示欄位

| 欄位       | 來源            | 若空值       |
|----------|---------------|------------|
| 主旨      | `title`        | 必填，不為空  |
| 時間      | `startTime` + `endTime` | 必填  |
| 參與人員  | `participants` | 不顯示該列   |
| 地點      | `location`     | 不顯示該列   |
| 內容      | `content`      | 不顯示該列   |
