# API 文檔

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
    "ID": "user",
    "email": "user@example.com",
    "account": "username",
    "password": "password123"
  }
#### 回應
#### 成功 (200 Created):

```json
{
  "message": "User created",
  "user": {
    "id": 1
  },
  "token": "JWT-TOKEN"
}
```

#### 失敗 1：用戶已存在（409 Conflict）

````json
{
  "message": "User already exists"
}
````

#### 失敗 2：電子郵件格式錯誤（400 Bad Request）

````json
{
  "message": "Invalid email format"
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
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username"
  },
  "token": "JWT-TOKEN"
}
```
####  失敗 (401 Unauthorized):

```json
{
  "message": "Invalid credentials"
}
```

## 2. 行事曆 API

### 2.1 創建行事曆事件（`POST /api/schedules`）
#### 描述 
用戶創建一個新的行事曆事件。

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
  "message": "Event created",
  "schedule": {
    "id": 1,
    "user_id": 1,
    "title": "Meeting with John",
    "description": "Discuss project details",
    "start_time": "2025-05-08T09:00:00",
    "end_time": "2025-05-08T10:00:00",
    "created_at": "2025-05-08T09:00:00"
  }
}
```

#### 失敗 1：(400 Bad Request):

```json
{
  "message": "伺服器回傳錯誤訊息"
}
```

#### 失敗 2：(401 Bad Request):

```json
{
  "message": "帳號尚未登入"
}
```



### 2.2 查詢行事曆事件（GET /api/schedules）
#### 描述
用戶查詢自己的行事曆事件。

- **請求** URL: /api/schedules
- **方法**: GET
- **請求參數**: 
    - user_id: 用戶的 ID

回應
成功 (200 OK):

```json
{
  "schedules": [
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
}
```

失敗 (401 Bad Request):

```json
{
  "message": "帳號尚未登入"
}
```



### 2.3 更新行事曆事件（PUT /api/schedules/:id）
#### 描述
用戶更新某個行事曆事件的詳細信息。

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
成功 (200 OK):

```json
{
  "message": "Schedule updated",
  "schedule": {
    "id": 1,
    "user_id": 1,
    "title": "Updated Meeting",
    "description": "Updated details",
    "start_time": "2025-05-08T10:00:00",
    "end_time": "2025-05-08T11:00:00",
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

### 2.4 刪除行事曆事件（DELETE /api/schedules/:id）
##### 描述
用戶刪除某個行事曆事件。

- **請求** URL: /api/schedules/:id
- **方法**: DELETE

回應
成功 (200 OK):

```json
{
  "message": "Schedule deleted"
}
```

失敗 (401 Bad Request):

```json
{
  "message": "帳號尚未登入"
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