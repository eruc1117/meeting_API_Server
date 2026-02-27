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
      console.error('register error --->', error);
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
      console.error('login error --> ', error);
      return {
        message: '伺服器錯誤',
        data: {},
        error: { code: 'E000_INTERNAL_ERROR' }
      };
    }
  }

  static async updatePassword(account, oirPassword, newPassword) {
    try {
      console.log("test start ")

      const user = await User.findByAccountOrEmail(account);


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

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await User.updatePassword(account, newPasswordHash);

      return {
        message: '更新成功',
        data: {}
      };
    } catch (error) {
      console.error('updatePassword error --->', error);
      return {
        message: '伺服器錯誤',
        data: {},
        error: { code: 'E000_INTERNAL_ERROR' }
      };
    }
  }
}

module.exports = AuthService;
