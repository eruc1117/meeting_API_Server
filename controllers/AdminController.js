const AdminService = require('../services/AdminService');
const { sendResponse } = require('../utils/responseHelper');

class AdminController {
  static async listUsers(req, res) {
    try {
      sendResponse(res, await AdminService.listUsers(), 200);
    } catch (error) {
      console.error('listUsers error');
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateUser(req, res) {
    try {
      const { role, is_active } = req.body || {};
      sendResponse(res, await AdminService.updateUser(req.user.id, req.params.id, { role, is_active }), 200);
    } catch (error) {
      console.error('updateUser error');
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteUser(req, res) {
    try {
      sendResponse(res, await AdminService.deleteUser(req.user.id, req.params.id), 200);
    } catch (error) {
      console.error('deleteUser error');
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = AdminController;
