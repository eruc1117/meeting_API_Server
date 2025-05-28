const AuthService = require('../services/AuthService');
const { mapErrorCodeToStatusCode } = require("../utils/httpStatusMapper")

class AuthController {
  static async register(req, res) {
    try {
      const { email, username, account, password, passwordChk } = req.body;
      
      const result = await AuthService.register(email, username, account, password, passwordChk);
      let status;
      let returnBody = {
        message: result.message,
        data: result.data
      }

      if (result.error) {
        status = mapErrorCodeToStatusCode(result.error.code)
        returnBody["error"] = {code: result.error.code}
      } else {
        status = 200;
      }

      res.status(status).json(returnBody);
    } catch (error) {
      console.log("register ---> ", error);
    }
  }

  static async login(req, res) {
    const { account, password } = req.body;
    const result = await AuthService.login(account, password);
    let status;
    let returnBody = {
      message: result.message,
      data: {
        user: result.user,
        token: result.token
      }
    }

    if (result.error) {
      status = mapErrorCodeToStatusCode(result.error.code)
      returnBody["error"] = {code: result.error.code}
    } else {
      status = 200;
    }
    res.status(status).json(returnBody);
  }
}

module.exports = AuthController;
