const pino = require('pino');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// pino 非同步寫入（sync: false）：批次寫入磁碟，不阻塞事件循環
const fileStream = pino.destination({
  dest: path.join(logDir, 'api.log'),
  sync: false,
});

const log = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    // 開發環境：轉為 pino-pretty 可讀格式輸出到 stdout
    ...(process.env.NODE_ENV !== 'production' && {
      transport: { target: 'pino-pretty', options: { colorize: true } },
    }),
  },
  // 生產環境才寫檔；開發環境 transport 會覆蓋 destination
  process.env.NODE_ENV === 'production' ? fileStream : undefined
);

const logger = (req, res, next) => {
  // 改用 jwt.decode（不驗簽章）：僅供 log 記錄 user_id 用途
  // 安全驗證由 authMiddleware 的 jwt.verify 負責，不在此重複
  let userId = 'anonymous';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.decode(authHeader.split(' ')[1]);
      userId = decoded?.id ?? 'unknown';
    } catch (_) {}
  }

  log.info({
    method: req.method,
    url: req.originalUrl,
    user_id: userId,
    ip: req.ip,
  });

  next();
};

module.exports = logger;
