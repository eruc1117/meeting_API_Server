require('dotenv').config();
// middlewares/ipWhitelist.js
const allowedIPs = [process.env.SOURCEIP, process.env.POSTMAN, process.env.AUTOTEST]; // 可加入其他可信來源

module.exports = function ipWhitelist(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;

  if (allowedIPs.includes(ip)) {
    return next();
  }

  // M-04 修正：不在錯誤回應中洩漏使用者 IP
  return res.status(403).json({
    message: '禁止存取：來源 IP 不允許',
    error: { code: 'E008_FORBIDDEN_IP' }
  });
};
