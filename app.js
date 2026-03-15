const express = require('express');
const app = express();
const routes = require('./routes'); // 整合路由
const logger = require("./middlewares/logger");
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 信任反向代理（讓 rate-limit 能正確讀到用戶真實 IP）
app.set('trust proxy', 1);

// 安全標頭
app.use(helmet());

// CORS 白名單
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// 全域 DDoS 防護：每分鐘最多 300 次（原本 100/15min = 6.67/min 過嚴）
// 多進程環境下需搭配 Redis store 共享計數，此為單進程基準值
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.GLOBAL_RATE_LIMIT) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '請求過於頻繁，請稍後再試', error: { code: 'E429_RATE_LIMIT' } },
});
app.use(globalLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(logger);
app.use('/api', routes); // 掛載統一前綴 /api

module.exports = app;
