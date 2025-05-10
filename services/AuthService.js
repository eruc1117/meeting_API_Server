const validator = require('../utils/validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

class AuthService {
  static async register(email, account, password) {
    try {
      if (!validator.validateEmail(email)) {
        return { status: 400, body: { message: 'Invalid email format' } };
      }

      const existingUser = await User.findByEmailOrUsername(email, account);
      if (existingUser) {
        return { status: 409, body: { message: 'User already exists' } };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUserId = await User.create(email, account, passwordHash);

      const token = jwt.sign({ id: newUserId }, process.env.SECRET, { expiresIn: '1h' });

      return {
        status: 201,
        body: {
          message: 'User created',
          user: { id: newUserId },
          token
        }
      };
    } catch (error) {
      console.log("register error ---> ", error);
    }
  }

  static async login(account, password) {
    try {
      const user = await User.findByEmailOrUsername(account, account);
      if (!user) {
        return { status: 401, body: { message: 'Invalid credentials' } };
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return { status: 401, body: { message: 'Invalid credentials' } };
      }

      const token = jwt.sign({ id: user.id }, 'secret', { expiresIn: '1h' });

      return {
        status: 200,
        body: {
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          },
          token
        }
      };

    } catch (error) {
      console.log("login error --> ", error);
    }
  }
}

module.exports = AuthService;
