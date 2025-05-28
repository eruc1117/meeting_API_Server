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
用戶登入，提供電子郵件和密碼，返回 JWT 用於認證。

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


## 2. 行事曆 API

### 2.1 創建行事曆事件（`POST /api/schedules`）
#### 描述 
1. 用戶創建一個新的行事曆事件。
2. 此需求需先進行身分驗證。
3. 建立的行事曆日期有重複時，回傳錯誤訊息。


- **請求** URL: /api/schedules
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
  "end_time": "2025-05-08T10:00:00"
}
```

回應
成功 (201 Created):

``` json
{
  "message": "活動建立成功",
  "data" :  {
      "id": 1,
      "user_id": 1,
      "title": "Meeting with John",
      "description": "Discuss project details",
      "start_time": "2025-05-08T09:00:00",
      "end_time": "2025-05-08T10:00:00",
      "created_at": "2025-05-08T09:00:00"
    },
  "error": {
  }
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


### 2.2 查詢行事曆事件（GET /api/schedules）
#### 描述
1. 用戶查詢自己的行事曆事件。
2. 此需求需先進行身分驗證。

- **請求** URL: /api/schedules
- **方法**: GET
- **請求參數**: 
    - user_id: 用戶的 ID
    - 
回應
成功 (200 OK):

```json
{
  "message": "活動查詢成功",
  "data" : {
    "schedule": [
      {
      "id": 1,
      "user_id": 1,
      "title": "Meeting with John",
      "description": "Discuss project details",
      "start_time": "2025-05-08T09:00:00",
      "end_time": "2025-05-08T10:00:00",
      "created_at": "2025-05-08T09:00:00"
    }
    ]
  },
  "error": {
  }
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


### 2.3 更新行事曆事件（PUT /api/schedules/:id）
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
  "end_time": "2025-05-08T11:00:00"
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

### 2.4 刪除行事曆事件（DELETE /api/schedules/:id）
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