const validator = require('../utils/validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

class AuthService {
  static async register(ID, email, account, password) {
    if (!validator.validateEmail(email)) {
      return { status: 400, body: { message: 'Invalid email format' } };
    }

    const existingUser = await User.findByEmailOrUsername(email, account);
    if (existingUser) {
      return { status: 409, body: { message: 'User already exists' } };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = await User.create(ID, email, account, passwordHash);

    const token = jwt.sign({ id: newUserId }, process.env.SECRET, { expiresIn: '1h' });

    return {
      status: 201,
      body: {
        message: 'User created',
        user: { id: newUserId },
        token
      }
    };
  }
}

module.exports = AuthService;
