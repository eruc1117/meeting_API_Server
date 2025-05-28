const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 檢查是否有 Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '帳號尚未登入', error: { code: "E004_UNAUTHORIZED" } });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded; // 把用戶資料附加到 req 物件
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: 'Token 無效或已過期' });
  }
};

module.exports = authMiddleware;
