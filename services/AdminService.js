/**
 * AdminService — 平台使用者管理（整套平台共用的 admin 身分）
 *
 * 角色只有 user / admin。admin 可以：列出所有使用者、改別人的角色、停用／啟用、刪除。
 * 不能改自己的角色或停用／刪除自己（避免把最後一個 admin 鎖在外面）。
 * 角色寫在 JWT 裡（1 小時），改了角色要重新登入才生效；股票系統（erucMoney）也是讀 JWT 的 role。
 */
const User = require('../models/User');

const ROLES = ['user', 'admin'];
const ok = (message, data) => ({ message, data });
const fail = (message, code) => ({ message, data: {}, error: { code } });

class AdminService {
  static async listUsers() {
    try {
      return ok('查詢成功', { users: await User.listAll() });
    } catch (error) {
      console.error('listUsers error');
      return fail('伺服器錯誤', 'E000_INTERNAL_ERROR');
    }
  }

  static async updateUser(actorId, targetId, { role, is_active } = {}) {
    const id = Number(targetId);
    if (!Number.isInteger(id) || id <= 0) return fail('使用者 id 格式錯誤', 'E011_DATA_TYPE_ERROR');
    if (role === undefined && is_active === undefined) return fail('沒有要更新的欄位', 'E012_MISSING_FIELDS');
    if (role !== undefined && !ROLES.includes(role)) return fail('角色只能是 user 或 admin', 'E011_DATA_TYPE_ERROR');
    if (is_active !== undefined && typeof is_active !== 'boolean') return fail('is_active 必須是布林值', 'E011_DATA_TYPE_ERROR');
    if (id === Number(actorId)) return fail('不能更改自己的角色或狀態', 'E005_FORBIDDEN');
    try {
      let user = await User.findById(id);
      if (!user) return fail('使用者不存在', 'E007_NOT_FOUND');
      if (role !== undefined) user = await User.updateRole(id, role);
      if (is_active !== undefined) user = await User.setActive(id, is_active);
      const { password_hash, ...publicUser } = user;
      return ok('更新成功', { user: publicUser });
    } catch (error) {
      console.error('updateUser error');
      return fail('伺服器錯誤', 'E000_INTERNAL_ERROR');
    }
  }

  static async deleteUser(actorId, targetId) {
    const id = Number(targetId);
    if (!Number.isInteger(id) || id <= 0) return fail('使用者 id 格式錯誤', 'E011_DATA_TYPE_ERROR');
    if (id === Number(actorId)) return fail('不能刪除自己', 'E005_FORBIDDEN');
    try {
      const n = await User.deleteById(id);
      if (!n) return fail('使用者不存在', 'E007_NOT_FOUND');
      return ok('刪除成功', { id });
    } catch (error) {
      console.error('deleteUser error');
      return fail('伺服器錯誤', 'E000_INTERNAL_ERROR');
    }
  }
}

module.exports = AdminService;
