const AuthService = require('../services/AuthService');

class AuthController {
  static async register(req, res) {
    try {
      const { email, account, password } = req.body;
      const result = await AuthService.register(email, account, password);
      res.status(result.status).json(result.body);
    } catch (error) {
      console.log("register ---> ", error);
    }
  }

  static async login(req, res) {
    const { account, password } = req.body;
    const result = await AuthService.login(account, password);
    res.status(result.status).json(result.body);
  }
}

module.exports = AuthController;
