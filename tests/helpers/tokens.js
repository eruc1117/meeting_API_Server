// 測試用：直接簽 JWT，不必每次走登入。payload 形狀與 AuthService.signToken 相同。
const jwt = require('jsonwebtoken');

function sign(payload, opts = {}) {
  return jwt.sign(payload, process.env.SECRET, { expiresIn: '1h', ...opts });
}

const userToken = (id, username = 'user', extra = {}) => sign({ id, username, role: 'user', ...extra });
const adminToken = (id, username = 'admin', extra = {}) => sign({ id, username, role: 'admin', ...extra });
const expiredToken = (id, username = 'user') => sign({ id, username, role: 'user' }, { expiresIn: -10 });

module.exports = { sign, userToken, adminToken, expiredToken };
