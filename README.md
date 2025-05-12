# 行事曆與聊天室 API 伺服器

這是一個使用 Node.js 搭配 Express 框架實作的 RESTful API，提供用戶註冊、登入、行事曆與聊天室相關功能。資料儲存採用 PostgreSQL，並使用 JWT 驗證用戶身份。
畫面顯示[前端專案](https://github.com/eruc1117/meeting_front_end)
---

##  安裝與啟動

### 安裝相關套件
```bash
npm install
```

### 環境參數
建立 .env 檔案
```
DB_HOST=PostgreSQL 資料庫 IP
DB_PORT=PostgreSQL 資料庫 Port
DB_NAME=PostgreSQL 資料庫 名稱
DB_USER=PostgreSQL 資料庫 帳號
DB_PASSWORD=PostgreSQL 資料庫 帳號密碼
SECRET=密碼加密密鑰
```

### 本機啟動
```bash
nodemon server.js
```

## API 說明

API 說明可參考 [API_DOC](https://github.com/eruc1117/meeting_API_Server/tree/main/API_DOC) 內檔案說明
