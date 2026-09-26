# API 文檔

## 0. **共通功能**
- 只允許特定 IP 來源
- 輸入資料驗證

## 1. **登入/註冊相關 API**

### 1.1 註冊用戶（`POST /api/auth/register`）

#### 描述
用於註冊新用戶，提供電子郵件、用戶名和密碼。

#### 請求
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **請求參數** (JSON Body):
  ```json
  {
    "email": "user@example.com",
    "username": "user",
    "account": "account",
    "password": "password123",
    "passwordChk": "password123"
  }
#### 回應
#### 成功 (200 Created):

```json
{
  "message": "使用者註冊成功",
  "data" : {
    "user": {"id": 1},
    "token": "JWT-TOKEN"
  },
  "error": { 
  }
}
```

#### 失敗 1：用戶已存在（409 Conflict）

```json
{
  "message": "註冊帳號已存在",
  "data" : {
  },
  "error": {
    "code" : "E001_USER_EXISTS"
  }
}
```

#### 失敗 2：電子郵件格式錯誤（400 Bad Request）

````json
{
  "message": "電子信箱格式錯誤",
  "data" : {
  },
  "error": {
    "code" : "E002_INVALID_EMAIL"
  }
}

````

#### 失敗 3：密碼輸入不同（400 Bad Request）

````json
{
  "message": "密碼和確認密碼不同",
  "data" : {
  },
  "error": {
    "code" : "E009_PASSWORD_NOT_SAME"
  }
}

````


### 1.2 用戶登入 (`POST /api/auth/login`)

#### 描述 
用戶登入，提供電子郵件或是帳號、密碼，返回 JWT 用於認證。

- **請求** URL: /api/auth/login

- **方法** : POST

- **請求參數**  (JSON Body):

```json
{
  "account": "user@example.com",
  "password": "password123"
}
```
回應
####  成功 (200 OK):

```json

{
  "message": "登入成功",
  "data" : {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
    },
    "token": "JWT-TOKEN"
  },
  "error": {
  }
}
```
####  失敗 (404 Unauthorized):

```json
{
  "message": "登入失敗，帳號不存在",
  "data" : {
  },
  "error": {
    "code" : "E008_ACCOUNT_NOT_EXIST"
  }
}

```

####  失敗 (401 Unauthorized):

```json
{
  "message": "登入失敗，帳號密碼錯誤",
  "data" : {
  },
  "error": {
    "code" : "E003_INVALID_CREDENTIALS"
  }
}

```



### 1.3 用戶更新密碼 (`PUT /api/auth/updatePassword`)

#### 描述 
用戶登入後，修改個人密碼。

- **請求** URL: /api/auth/updatePassword

- **方法** : PUT

- **請求參數**  (JSON Body):

```json
{
  "account": "user@example.com",
  "oirPassword": "password123",
  "newPassword": "password123"
}
```
回應
####  成功 (200 OK):

```json

{
  "message": "更新成功",
  "data" : {
  },
  "error": {
  }
}
```



####  失敗 (401 Unauthorized):

```json
{
  "message": "更新失敗，帳號密碼錯誤",
  "data" : {
  },
  "error": {
    "code" : "E003_INVALID_CREDENTIALS"
  }
}

```

### 1.4 取得用戶資料 (`GET /api/user/info?id=`)

#### 描述
用戶查詢自己的個人資料。需要 JWT 驗證，且只能查詢與 Token 中 id 相同的使用者資料。

- **請求** URL: /api/user/info?id=

- **方法** : GET

- **請求參數**
- (Header):
```
Authorization: Bearer <JWT-TOKEN>
```
- (Query):
  - `id`：要查詢的使用者 ID（必填，且必須與 JWT Token 中的 id 相同）

回應
####  成功 (200 OK):

```json
{
  "message": "成功",
  "data" : {
    "id": 1,
    "email": "user@example.com",
    "username": "user",
    "account": "account"
  },
  "error": {}
}
```

####  失敗 1：未提供 Token（401 Unauthorized）

```json
{
  "message": "帳號尚未登入",
  "error": {
    "code": "E004_UNAUTHORIZED"
  }
}
```

####  失敗 2：查詢其他使用者資料（403 Forbidden）

```json
{
  "message": "查詢失敗，無權限查詢其他使用者資料",
  "data": {},
  "error": {
    "code": "E005_FORBIDDEN"
  }
}
```

####  失敗 3：缺少 id 參數（400 Bad Request）

```json
{
  "message": "查詢失敗，缺少必要資料",
  "data": {},
  "error": {
    "code": "E012_MISSING_FIELDS"
  }
}
```

####  失敗 4：使用者不存在（404 Not Found）

```json
{
  "message": "查詢失敗，使用者不存在",
  "data": {},
  "error": {
    "code": "E007_NOT_FOUND"
  }
}
```



### 1.5 搜尋使用者（`GET /api/users/search`）

#### 描述
依照名稱或信箱模糊搜尋使用者，供參與人員自動補全使用。需要 JWT 驗證。

- **請求** URL: `/api/users/search`
- **方法**: GET
- **請求參數**
- (Header):
```
Authorization: Bearer <JWT-TOKEN>
```
- (Query):
  - `q`：搜尋關鍵字（名稱或信箱，必填，最少 1 字元）

#### 回應
##### 成功 (200 OK):

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

##### 失敗 1：缺少 q 參數（400 Bad Request）

```json
{
  "message": "查詢失敗，缺少必要資料",
  "data": {},
  "error": {
    "code": "E012_MISSING_FIELDS"
  }
}
```

##### 失敗 2：未登入（401 Unauthorized）

```json
{
  "message": "帳號尚未登入",
  "data": {},
  "error": {
    "code": "E004_UNAUTHORIZED"
  }
}
```

---

## 2. 行事曆 API

### 2.1 創建行事曆事件（`POST /api/schedules/create`）
#### 描述 
1. 用戶創建一個新的行事曆事件。
2. 此需求需先進行身分驗證。
3. 建立的行事曆日期有重複時，回傳錯誤訊息。


- **請求** URL: /api/schedules/create
- **方法**: POST
- **請求參數**
- (Header):
```
Authorization: Bearer <JWT-TOKEN>
```
- (JSON Body):
``` json
{
  "user_id": 1,
  "title": "Meeting with John",
  "description": "Discuss project details",
  "start_time": "2025-05-08T09:00:00",
  "end_time": "2025-05-08T10:00:00",
  "is_public": false,
  "location": "會議室 A",
  "participants": "小明、小美"
}
```

回應
成功 (201 Created):

``` json
{
  "message": "活動建立成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Meeting with John",
    "description": "Discuss project details",
    "start_time": "2025-05-08T09:00:00",
    "end_time": "2025-05-08T10:00:00",
    "is_public": false,
    "location": "會議室 A",
    "participants": "小明、小美",
    "created_at": "2025-05-08T09:00:00",
    "updated_at": "2025-05-08T09:00:00"
  },
  "error": {}
}
```

#### 失敗 1：(404 Bad Request):

```json

{
  "message": "活動建立失敗，資料未提供",
  "data" : {},
  "error": {
    "code" : "E007_NOT_FOUND"
  }
}
```

#### 失敗 2：(401 Bad Request):

```json
{
  "message": "帳號尚未登入",
  "data" : {},
  "error": {
    "code" : "E004_UNAUTHORIZED"
  }
}
```

#### 失敗 3：(409 Bad Request):

```json
{
  "message": "活動建立失敗，時段重複",
  "data" : {
    "reStartTime": "",
    "reEndTime": ""
  },
  "error": {
    "code" : "E006_SCHEDULE_CONFLICT"
  }
}
```

#### 失敗 4：(401 Bad Request):

```json
{
  "message": "活動建立失敗，資料格式錯誤",
  "data" : {
    "reStartTime": "",
    "reEndTime": ""
  },
  "error": {
    "code" : "E011_DATA_TYPE_ERROR"
  }
}
```


### 2.2 查詢行事曆事件（POST /api/schedules/query）
#### 描述
1. 查詢指定使用者的行事曆事件。
2. 此需求需先進行身分驗證。

- **請求** URL: /api/schedules/query
- **方法**: POST
- **請求參數**:
- (Header):
```
Authorization: Bearer <JWT-TOKEN>
```
- (JSON Body):
```json
{
  "user_id": 1,
  "start_time": "2026-02-01T00:00:00",
  "end_time": "2026-02-28T23:59:59"
}
```

> `start_time`、`end_time` 為選填；未提供時回傳該使用者所有活動。

回應
成功 (200 OK):

```json
{
  "message": "活動查詢成功",
  "data": {
    "schedule": [
      {
        "id": 1,
        "user_id": 1,
        "title": "Meeting with John",
        "description": "Discuss project details",
        "start_time": "2025-05-08T09:00:00",
        "end_time": "2025-05-08T10:00:00",
        "is_public": false,
        "location": "會議室 A",
        "participants": "小明、小美",
        "created_at": "2025-05-08T09:00:00",
        "updated_at": "2025-05-08T09:00:00"
      }
    ]
  },
  "error": {}
}
```

#### 失敗 1：(400 Bad Request):

```json

{
  "message": "活動查詢失敗",
  "data" : {},
  "error": {
    "code" : "E007_NOT_FOUND"
  }
}
```

#### 失敗 2：(401 Bad Request):

```json
{
  "message": "帳號尚未登入",
  "data" : {},
  "error": {
    "code" : "E004_UNAUTHORIZED"
  }
}
```


### 2.3 更新行事曆事件（PUT /api/schedules/update:id）
#### 描述

1. 用戶更新某個行事曆事件的詳細信息。
2. 此需求需先進行身分驗證。
3. 建立的行事曆日期有重複時，回傳錯誤訊息。

- **請求** URL: /api/schedules/:id

- **方法**: PUT

- **請求參數** (JSON Body):

```json
{
  "title": "Updated Meeting",
  "description": "Updated details",
  "start_time": "2025-05-08T10:00:00",
  "end_time": "2025-05-08T11:00:00",
  "is_public": true,
  "location": "會議室 B",
  "participants": "小明、老王"
}
```
回應
#### 成功 (200 OK):

```json
{
  "message": "活動更新成功",
  "data" : {
  },
  "error": {
  }
}
```
#### 失敗 1：(400 Bad Request):

```json

{
  "message": "活動更新失敗",
  "data" : {},
  "error": {
    "code" : "E007_NOT_FOUND"
  }
}
```

#### 失敗 2：(401 Bad Request):

```json
{
  "message": "帳號尚未登入",
  "data" : {},
  "error": {
    "code" : "E004_UNAUTHORIZED"
  }
}
```

#### 失敗 3：(409 Bad Request):

```json
{
  "message": "活動更新失敗，時段重複",
  "data" : {
    "reStartTime": "",
    "reEndTime": "" 
  },
  "error": {
    "code" : "E006_SCHEDULE_CONFLICT"
  }
}
```

### 2.4 刪除行事曆事件（DELETE /api/schedules/delete:id）
##### 描述
用戶刪除某個行事曆事件。

- **請求** URL: /api/schedules/:id
- **方法**: DELETE

回應
成功 (200 OK):

```json
{
  "message": "活動刪除成功",
  "data" : {
  },
  "error": {
  }
}
```

#### 失敗 1：(400 Bad Request):

```json

{
  "message": "活動刪除失敗",
  "data" : {},
  "error": {
    "code" : "E007_NOT_FOUND"
  }
}
```

#### 失敗 2：(401 Bad Request):

```json
{
  "message": "帳號尚未登入",
  "data" : {},
  "error": {
    "code" : "E004_UNAUTHORIZED"
  }
}
```


### 2.5 參加行事曆事件（POST /api/schedules/attend/:id）
##### 描述
用戶參加行事曆活動。

- **請求** URL: /api/schedules/attend/:id
- **方法**: POST

回應
成功 (200 OK):

```json
{
  "message": "活動參加成功",
  "data" : {
  },
  "error": {
  }
}
```

#### 失敗 1：(400 Bad Request):

```json

{
  "message": "活動參加失敗",
  "data" : {},
  "error": {
    "code" : "E007_NOT_FOUND"
  }
}
```

#### 失敗 2：(401 Bad Request):

```json
{
  "message": "帳號尚未登入",
  "data" : {},
  "error": {
    "code" : "E004_UNAUTHORIZED"
  }
}
```

### 2.6 退出行事曆事件（DELETE /api/schedules/attend/:id）
##### 描述
用戶退出行事曆活動。

- **請求** URL: /api/schedules/attend/:id
- **方法**: DELETE

回應
成功 (200 OK):

```json
{
  "message": "活動退出成功",
  "data" : {
  },
  "error": {
  }
}
```

#### 失敗 1：(400 Bad Request):

```json

{
  "message": "活動退出失敗",
  "data" : {},
  "error": {
    "code" : "E007_NOT_FOUND"
  }
}
```

#### 失敗 2：(401 Bad Request):

```json
{
  "message": "帳號尚未登入",
  "data" : {},
  "error": {
    "code" : "E004_UNAUTHORIZED"
  }
}
```



## 3. 聊天室 API
### 3.1 創建聊天室（POST /api/groups）
#### 描述
用戶創建一個新的聊天室群組。

- **請求** URL: /api/groups
- **方法**: POST
- **請求參數** (JSON Body):


```json
{
  "name": "Project Chat"
}
```

回應
成功 (201 Created):

```json
{
  "message": "Group created",
  "group": {
    "id": 1,
    "name": "Project Chat",
    "created_at": "2025-05-08T09:00:00"
  }
}
```

失敗 (401 Bad Request):

```json
{
  "message": "帳號尚未登入"
}
```


### 3.2 發送消息（POST /api/messages）

#### 描述
用戶在聊天室中發送消息。

- **請求** URL: /api/messages
- **方法**: POST

請求參數 (JSON Body):
```json
{
  "chat_room_id": 1,
  "sender_id": 1,
  "content": "Hello, this is a message"
}
```
回應
成功 (201 Created):

```json
{
  "message": "Message sent",
  "message_data": {
    "id": 1,
    "chat_room_id": 1,
    "sender_id": 1,
    "content": "Hello, this is a message",
    "  ": "2025-05-08T09:05:00"
  }
}
```

失敗 (401 Bad Request):

```json
{
  "message": "帳號尚未登入"
}
```

---

## 4. 股票儀表板代理 API（`/api/stock/*`）

行事曆平台的「股票」分頁用的代理（Iteration 44 起儀表板全部功能都在統一前端，代理轉所有方法）。**登入系統只有一套**：本專案簽的 JWT（payload `{ id, username, role }`，1 小時）
原樣轉給 erucMoney 的 Node API（`STOCK_API_URL`）；erucMoney 的 `JWT_SECRET` 與本專案的 `SECRET` 相同，
它驗過 token 後以 `external_id = id` 對應（第一次自動建立）自己的使用者列，持股與交易台帳因此是使用者自己的。

### 4.1 上游狀態（`GET /api/stock/health`）

- 需 `Authorization: Bearer <JWT>`
- 成功：`200 { "data": { "online": true, "upstream": { "ok": true, "time": "..." } } }`
- 上游離線：`502 { "message": "...", "error": { "code": "E502_STOCK_UPSTREAM" }, "data": { "online": false } }`
- 沒帶 token：`401 E004_UNAUTHORIZED`

### 4.2 轉發（`ANY /api/stock/<path>?<query>`）

方法（GET／POST／PUT／DELETE）、query、JSON body 原樣轉到 `STOCK_API_URL` 的同一路徑。允許的第一段路徑：
`health`、`stocks`、`forecast`、`catalog`、`predictions`、`voting`、`holdings`、`cash`、`gap`、`model`、`models`、
`news`、`crawler`、`data`、`us`、`auth`；其餘 `403 E403_STOCK_PATH`。不轉 `/auth/login`（登入在本平台）與
`/auth/change-password`（SSO 使用者在上游沒有密碼）。

上游的權限由上游決定：`/crawler`、`/models`、`/data`、`/auth/users` 要 admin 角色（erucMoney `.env` 的
`SSO_ADMIN_USERNAMES` 可指定哪些本平台帳號第一次進去就升 admin）。長工作（`/data/backfill`、`/models/evaluate`、
`/crawler/*`、`/forecast/weekly/run`、`/voting/run`、`/model/retrain`）逾時放寬到 `STOCK_API_LONG_TIMEOUT_MS`（預設 180 秒）。

回應：`200 { "data": <上游原始 JSON> }`。上游 4xx（403／404／409／422）原樣保留狀態碼，
`{ "message": <上游 detail>, "error": { "code": "E502_STOCK_UPSTREAM" }, "upstream": <上游 JSON> }`；
上游 5xx、連線失敗、逾時 → `502`；上游回 401 → `502 E502_STOCK_AUTH`（通常是兩邊密鑰不同）。

### 4.3 錯誤碼

| 代碼 | HTTP | 說明 |
|------|------|------|
| `E403_STOCK_PATH` | 403 | 不允許的路徑或方法 |
| `E004_UNAUTHORIZED` | 401 | 沒帶 token |
| `E502_STOCK_AUTH` | 502 | 上游不接受這個 token（兩邊 JWT 密鑰不同） |
| `E502_STOCK_UPSTREAM` | 502 | 上游連線失敗、逾時或回錯誤 |

## 5. 平台管理 API（`/api/admin/*`，需 admin）

整套平台只有一種 admin 身分。`users.role`（`user` / `admin`）寫進登入 JWT（payload `{ id, username, role }`），
行事曆的管理 API 與股票系統（erucMoney）都讀同一個 role：股票系統每次請求把 token 的 role 同步進自己的 users 表，
所以在這裡升降級，股票那邊立刻跟著變。第一個 admin 由 `.env` 的 `ADMIN_ACCOUNTS`（帳號或 email，逗號分隔）在註冊或登入時自動升級。
角色寫在 token 裡（1 小時），改了角色要對方重新登入才會反映在他的 token 上。

- 全部需要 `Authorization: Bearer <JWT>` 且 role 為 admin；否則 `403 { "message": "需要管理者權限", "error": { "code": "E005_FORBIDDEN" } }`
- 停用的帳號登入時回 `403 E014_ACCOUNT_DISABLED`

### 5.1 列出使用者（`GET /api/admin/users`）

`200 { "message": "查詢成功", "data": { "users": [ { "id", "email", "username", "account", "role", "is_active", "created_at" } ] } }`

### 5.2 更新角色或狀態（`PUT /api/admin/users/:id`）

Body：`{ "role": "admin" | "user" }` 或 `{ "is_active": true | false }`（可同時給）。

- 成功：`200 { "message": "更新成功", "data": { "user": { … } } }`
- 改自己：`403 E005_FORBIDDEN`；角色不是 user/admin：`400 E011_DATA_TYPE_ERROR`；沒給欄位：`400 E012_MISSING_FIELDS`；不存在：`404 E007_NOT_FOUND`

### 5.3 刪除使用者（`DELETE /api/admin/users/:id`）

行程、參與紀錄、訊息、聊天室成員隨外鍵一起刪；股票系統對應的使用者列與持股在那邊由 admin 另外處理。

- 成功：`200 { "message": "刪除成功", "data": { "id": 5 } }`；刪自己：`403`；不存在：`404`
