const AuthService = require('../services/AuthService');

class AuthController {
  static async register(req, res) {
    const { ID, email, account, password } = req.body;
    const result = await AuthService.register(ID, email, account, password);
    res.status(result.status).json(result.body);
  }
}

module.exports = AuthController;
