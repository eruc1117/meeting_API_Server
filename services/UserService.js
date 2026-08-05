const User = require('../models/User');

// M-08 修正：搜尋結果不回傳完整 email，遮罩後僅供辨識（e***@example.com）
const maskEmail = (email) => {
  if (typeof email !== 'string' || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
};

class UserService {
  static async searchUsers(q) {
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return {
        message: '查詢失敗，缺少必要資料',
        data: {},
        error: { code: 'E012_MISSING_FIELDS' }
      };
    }

    // M-08 修正：限制查詢字串長度，避免異常長輸入
    if (q.trim().length > 100) {
      return {
        message: '查詢失敗，搜尋字串過長',
        data: {},
        error: { code: 'E011_DATA_TYPE_ERROR' }
      };
    }

    try {
      const users = await User.searchByKeyword(q.trim());
      return {
        message: '查詢成功',
        data: { users: users.map(u => ({ ...u, email: maskEmail(u.email) })) }
      };
    } catch (error) {
      console.error('searchUsers error');
      return {
        message: '伺服器錯誤',
        data: {},
        error: { code: 'E000_INTERNAL_ERROR' }
      };
    }
  }

  static async getUserInfo(id) {
    try {
      if (!id) {
        return {
          message: '查詢失敗，缺少必要資料',
          data: {},
          error: { code: 'E012_MISSING_FIELDS' }
        };
      }

      const user = await User.findById(id);

      if (!user) {
        return {
          message: '查詢失敗，使用者不存在',
          data: {},
          error: { code: 'E007_NOT_FOUND' }
        };
      }

      return {
        message: '成功',
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          account: user.account
        }
      };
    } catch (error) {
      console.error('getUserInfo error');
      return {
        message: '伺服器錯誤',
        data: {},
        error: { code: 'E000_INTERNAL_ERROR' }
      };
    }
  }
}

module.exports = UserService;
