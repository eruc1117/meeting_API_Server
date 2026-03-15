# 10 萬人同時線上 - 討論紀錄

建立日期：2026-03-07
討論對象：backend（Node.js + Express + PostgreSQL）

## 文件索引

| 文件 | 說明 |
|------|------|
| [優化方向分析.md](./優化方向分析.md) | 針對現有程式碼的瓶頸分析與優化建議（P0~P3 優先序） |
| [測試方案.md](./測試方案.md) | 負載/壓力/浸泡/峰值測試腳本與執行流程 |

## 快速摘要

**立即需要處理（P0）**
1. IP 白名單移至路由層，避免所有真實用戶被封鎖
2. PM2 多進程啟動（利用多核 CPU）
3. PgBouncer + 調整 DB Pool（預設 10 連線根本不夠）

**核心架構改善（P1）**
4. Redis 作為快取層 + Rate Limit 共享 store
5. DB 索引（`schedules.user_id + start_time`、`users.account`）
6. Logger 改用 pino（非同步批次寫入）

**測試工具**
- 主要：[k6](https://k6.io/)
- 替代：[Artillery](https://www.artillery.io/)
