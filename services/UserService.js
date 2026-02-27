const User = require('../models/User');

class UserService {
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
      console.error('getUserInfo error --->', error);
      return {
        message: '伺服器錯誤',
        data: {},
        error: { code: 'E000_INTERNAL_ERROR' }
      };
    }
  }
}

module.exports = UserService;
