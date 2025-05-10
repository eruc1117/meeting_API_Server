# 自定義錯誤代碼列表（Error Code List）

| 錯誤碼（Code） | 錯誤名稱（Name）           | HTTP 狀態碼 | 描述（Description）                     |
|----------------|-----------------------------|-------------|------------------------------------------|
| `1001`         | `UNAUTHORIZED`              | 401         | 使用者尚未登入或 Token 無效              |
| `1002`         | `FORBIDDEN`                 | 403         | 權限不足，禁止存取此資源                 |
| `1003`         | `INVALID_CREDENTIALS`       | 401         | 電子郵件或密碼錯誤                       |
| `1004`         | `USER_ALREADY_EXISTS`       | 400         | 註冊時用戶已存在                         |
| `1005`         | `USER_NOT_FOUND`            | 404         | 查無此用戶                               |
| `2001`         | `VALIDATION_ERROR`          | 400         | 資料格式錯誤，例如缺少必要欄位           |
| `2002`         | `RESOURCE_NOT_FOUND`        | 404         | 查無指定資源（如：行事曆、聊天室等）     |
| `2003`         | `DUPLICATE_RESOURCE`        | 409         | 資源重複（如群組名稱、事件標題）         |
| `3001`         | `DATABASE_ERROR`            | 500         | 資料庫內部錯誤                           |
| `3002`         | `INTERNAL_SERVER_ERROR`     | 500         | 伺服器未知錯誤                           |
| `3003`         | `WEBSOCKET_CONNECTION_FAIL` | 500         | WebSocket 連線建立失敗                   |

