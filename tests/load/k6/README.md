# k6 負載測試

## 安裝 k6

```bash
# Windows (Chocolatey)
choco install k6

# macOS
brew install k6
```

## 測試腳本

| 腳本 | 情境 | VU 規模 | 時長 |
|------|------|---------|------|
| `login-load.js` | 登入 API 負載測試，從 1k 爬升至 100k VU | 最高 100,000 | ~16 分鐘 |
| `schedule-crud.js` | 行事曆建立 + 查詢 CRUD | 10,000 | 10 分鐘 |
| `spike-test.js` | 突發峰值（10 秒內暴增至 50k VU） | 最高 50,000 | ~2.5 分鐘 |
| `soak-test.js` | 長時間穩定性 + 記憶體洩漏偵測 | 1,000 | 2 小時 |

## 執行方式

```bash
# 基本執行
k6 run tests/load/k6/login-load.js

# 儲存 JSON 結果
k6 run --out json=tests/load/reports/login-load-$(date +%Y%m%dT%H%M%S).json tests/load/k6/login-load.js

# 自訂帳密
TEST_ACCOUNT=myuser@test.com TEST_PASSWORD=MyPass1 k6 run tests/load/k6/schedule-crud.js

# 指定目標主機
BASE_URL=http://192.168.1.100:3000 k6 run tests/load/k6/spike-test.js

# 即時 Web Dashboard（k6 v0.43+）
k6 run --out dashboard tests/load/k6/login-load.js
```

## 閾值標準

| 情境 | p95 延遲 | p99 延遲 | 失敗率 |
|------|----------|----------|--------|
| 一般負載（login-load, schedule-crud） | < 500ms | - | < 1% |
| 突發峰值（spike-test） | - | < 2000ms | < 5% |
| 浸泡（soak-test） | < 500ms | - | < 1% |

## 前置準備

執行大規模測試前，請先建立足夠數量的測試帳號：

```bash
node tests/load/setup-test-users.js
```

並確認 PostgreSQL 與 PM2 設定已依 `docs/scalability/測試方案.md` 調整。
