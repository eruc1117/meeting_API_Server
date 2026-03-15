const validator = require('../utils/validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

class AuthService {
  static async register(email, username, account, password, passwordChk) {
    try {
      if (!validator.validateEmail(email)) {
        return {
          message: '電子信箱格式錯誤',
          data: {},
          error: { code: 'E002_INVALID_EMAIL' }
        };
      }

      // H-02 修正：密碼強度驗證
      if (!validator.validatePassword(password)) {
        return {
          message: '密碼強度不足，需至少 8 字元並包含大小寫英文及數字',
          data: {},
          error: { code: 'E013_WEAK_PASSWORD' }
        };
      }

      if (password !== passwordChk) {
        return {
          message: '密碼和確認密碼不同',
          data: {},
          error: { code: 'E009_PASSWORD_NOT_SAME' }
        };
      }

      const existingUser = await User.findByEmailOrUsername(email, account);

      if (existingUser) {
        return {
          message: '註冊帳號已存在',
          data: {},
          error: { code: 'E001_USER_EXISTS' }
        };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUserId = await User.create(email, username, account, passwordHash);

      const token = jwt.sign({ id: newUserId }, process.env.SECRET, { expiresIn: '1h' });

      return {
        message: '使用者註冊成功',
        data: {
          user: { id: newUserId },
          token
        },
      };
    } catch (error) {
      console.error('register error');
      return {
        message: '伺服器錯誤',
        data: {},
        error: { code: 'E000_INTERNAL_ERROR' }
      };
    }
  }


  static async login(account, password) {
    try {
      const user = await User.findByAccountOrEmail(account);
      if (!user) {
        return {
          message: '登入失敗，帳號不存在',
          data: {},
          error: { code: 'E008_ACCOUNT_NOT_EXIST' }
        };
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return {
          message: '登入失敗，帳號密碼錯誤',
          data: {},
          error: { code: 'E003_INVALID_CREDENTIALS' }
        };
      }

      const token = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: '1h' });

      return {
        message: '登入成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          },
          token
        }
      };

    } catch (error) {
      console.error('login error');
      return {
        message: '伺服器錯誤',
        data: {},
        error: { code: 'E000_INTERNAL_ERROR' }
      };
    }
  }

  // H-01 修正：改為接受 user_id（從 JWT），不依賴請求中的 account
  static async updatePassword(user_id, oirPassword, newPassword) {
    try {
      const user = await User.findById(user_id);

      if (!user) {
        return {
          message: '更新失敗，使用者不存在',
          data: {},
          error: { code: 'E003_INVALID_CREDENTIALS' }
        };
      }

      const isMatch = await bcrypt.compare(oirPassword, user.password_hash);
      if (!isMatch) {
        return {
          message: '更新失敗，帳號密碼錯誤',
          data: {},
          error: { code: 'E003_INVALID_CREDENTIALS' }
        };
      }

      // H-02 修正：新密碼也需通過強度驗證
      if (!validator.validatePassword(newPassword)) {
        return {
          message: '新密碼強度不足，需至少 8 字元並包含大小寫英文及數字',
          data: {},
          error: { code: 'E013_WEAK_PASSWORD' }
        };
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await User.updatePasswordById(user_id, newPasswordHash);

      return {
        message: '更新成功',
        data: {}
      };
    } catch (error) {
      console.error('updatePassword error');
      return {
        message: '伺服器錯誤',
        data: {},
        error: { code: 'E000_INTERNAL_ERROR' }
      };
    }
  }
}

module.exports = AuthService;
