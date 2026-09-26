// 需要 admin 角色（掛在 authMiddleware 之後；角色來自 JWT payload 的 role）。
// 整套平台只有這一種 admin：行事曆的管理 API 用它，股票系統也信任同一個 JWT 的 role。
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理者權限', error: { code: 'E005_FORBIDDEN' } });
  }
  next();
};

module.exports = adminMiddleware;
