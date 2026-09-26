jest.mock('../../models/User');
const User = require('../../models/User');
const AdminService = require('../../services/AdminService');

describe('AdminService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('listUsers returns all users', async () => {
    User.listAll.mockResolvedValue([{ id: 1, account: 'a', role: 'admin' }, { id: 2, account: 'b', role: 'user' }]);
    const r = await AdminService.listUsers();
    expect(r.data.users).toHaveLength(2);
  });

  it('updateUser rejects an unknown role', async () => {
    const r = await AdminService.updateUser(1, 2, { role: 'root' });
    expect(r.error.code).toBe('E011_DATA_TYPE_ERROR');
    expect(User.updateRole).not.toHaveBeenCalled();
  });

  it('updateUser rejects changing yourself', async () => {
    const r = await AdminService.updateUser(1, '1', { role: 'user' });
    expect(r.error.code).toBe('E005_FORBIDDEN');
  });

  it('updateUser rejects an empty body', async () => {
    const r = await AdminService.updateUser(1, 2, {});
    expect(r.error.code).toBe('E012_MISSING_FIELDS');
  });

  it('updateUser 404 when the target does not exist', async () => {
    User.findById.mockResolvedValue(undefined);
    const r = await AdminService.updateUser(1, 9, { role: 'admin' });
    expect(r.error.code).toBe('E007_NOT_FOUND');
  });

  it('updateUser promotes and returns the public user', async () => {
    User.findById.mockResolvedValue({ id: 2, account: 'b', role: 'user', password_hash: 'x' });
    User.updateRole.mockResolvedValue({ id: 2, account: 'b', role: 'admin', is_active: true });
    const r = await AdminService.updateUser(1, 2, { role: 'admin' });
    expect(User.updateRole).toHaveBeenCalledWith(2, 'admin');
    expect(r.data.user).toEqual({ id: 2, account: 'b', role: 'admin', is_active: true });
  });

  it('updateUser can disable an account', async () => {
    User.findById.mockResolvedValue({ id: 2, role: 'user' });
    User.setActive.mockResolvedValue({ id: 2, role: 'user', is_active: false });
    const r = await AdminService.updateUser(1, 2, { is_active: false });
    expect(User.setActive).toHaveBeenCalledWith(2, false);
    expect(r.data.user.is_active).toBe(false);
  });

  it('deleteUser rejects deleting yourself', async () => {
    const r = await AdminService.deleteUser(1, 1);
    expect(r.error.code).toBe('E005_FORBIDDEN');
    expect(User.deleteById).not.toHaveBeenCalled();
  });

  it('deleteUser 404 when nothing was deleted', async () => {
    User.deleteById.mockResolvedValue(0);
    const r = await AdminService.deleteUser(1, 5);
    expect(r.error.code).toBe('E007_NOT_FOUND');
  });

  it('deleteUser deletes another user', async () => {
    User.deleteById.mockResolvedValue(1);
    const r = await AdminService.deleteUser(1, 5);
    expect(r.data.id).toBe(5);
  });
});
