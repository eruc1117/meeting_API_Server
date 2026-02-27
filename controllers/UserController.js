const UserService = require('../services/UserService');
const { sendResponse } = require('../utils/responseHelper');

class UserController {
  static async getUserInfo(req, res) {
    try {
      const { id } = req.query;

      if (id && parseInt(id) !== req.user.id) {
        return res.status(403).json({
          message: '查詢失敗，無權限查詢其他使用者資料',
          data: {},
          error: { code: 'E005_FORBIDDEN' }
        });
      }

      const result = await UserService.getUserInfo(id);
      sendResponse(res, result, 200);
    } catch (error) {
      console.error('getUserInfo ---> ', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = UserController;
