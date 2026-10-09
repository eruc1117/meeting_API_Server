const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * 可選登入（股票代理用，Iteration 52）：沒帶 Bearer 就當匿名放行（req.user 留空）；
 * 帶了就照 authMiddleware 驗，壞的、過期的仍回 401（前端靠它清掉登入狀態）。
 * 哪些路徑匿名能看由 StockService 決定（分析類 GET 可以；持股、閒置資金與所有寫入不行）。
 */
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token 無效或已過期' });
  }
};

module.exports = optionalAuthMiddleware;
