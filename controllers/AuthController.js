const AuthService = require('../services/AuthService');
const { sendResponse } = require('../utils/responseHelper');

class AuthController {
  static async register(req, res) {
    try {
      const { email, username, account, password, passwordChk } = req.body;
      const result = await AuthService.register(email, username, account, password, passwordChk);
      sendResponse(res, result, 200);
    } catch (error) {
      console.error('register ---> ', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async login(req, res) {
    try {
      const { account, password } = req.body;
      const result = await AuthService.login(account, password);
      sendResponse(res, result, 200);
    } catch (error) {
      console.error('login ---> ', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = AuthController;
