# 自定義錯誤代碼列表（Error Code List）

| Code                       | 說明         | HTTP Status |
| -------------------------- | ---------- | ---------- |
| `E000_INTERNAL_ERROR`         | 伺服器錯誤    |500    |
| `E001_USER_EXISTS`         | 註冊帳號已存在    |409    |
| `E002_INVALID_EMAIL`       | Email 格式錯誤 |400    |
| `E003_INVALID_CREDENTIALS` | 登入帳密錯誤     |401    |
| `E004_UNAUTHORIZED`        | 未登入        |401 |
| `E005_FORBIDDEN`           | 權限不足       |403    |
| `E006_SCHEDULE_CONFLICT`   | 行事曆時段重疊    |409    |
| `E007_NOT_FOUND`           | 資源不存在      |404    |
| `E008_ACCOUNT_NOT_EXIST` | 帳號不存在     |404    |
| `E009_PASSWORD_NOT_SAME` | 密碼和確認密碼不同     |400    |
| `E010_SCHEDULE_SERVER` | 功能異常     |500    |
| `E011_DATA_TYPE_ERROR` | 資料格式錯誤     |400    |
