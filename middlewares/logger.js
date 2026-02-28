const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'api.log');

function formatTime(ts) {
  return new Date(ts).toISOString();
}

const logger = (req, res, next) => {
  const callTime = new Date();

  // 從 Authorization header decode JWT（不做驗證，僅取資料）
  let userId = 'anonymous';
  let tokenIat = '-';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.decode(authHeader.split(' ')[1]);
      if (decoded) {
        userId = decoded.id ?? decoded.user_id ?? 'unknown';
        tokenIat = decoded.iat ? formatTime(decoded.iat * 1000) : '-';
      }
    } catch (_) {}
  }

  const line = [
    `[${formatTime(callTime)}]`,
    `${req.method} ${req.originalUrl}`,
    `| user_id: ${userId}`,
    `| token_iat: ${tokenIat}`,
  ].join(' ');

  console.log(line);
  fs.appendFile(logFile, line + '\n', (err) => {
    if (err) console.error('Logger write error:', err);
  });

  next();
};

module.exports = logger;
