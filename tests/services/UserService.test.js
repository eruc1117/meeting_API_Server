const UserService = require('../../services/UserService');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('UserService.getUserInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if id is missing', async () => {
    const result = await UserService.getUserInfo(undefined);
    expect(result.message).toBe('查詢失敗，缺少必要資料');
    expect(result.error.code).toBe('E012_MISSING_FIELDS');
  });

  it('should return error if user not found', async () => {
    User.findById.mockResolvedValue(null);

    const result = await UserService.getUserInfo('999');
    expect(result.message).toBe('查詢失敗，使用者不存在');
    expect(result.error.code).toBe('E007_NOT_FOUND');
  });

  it('should return user info on success', async () => {
    const mockUser = { id: 1, email: 'user@example.com', username: 'user', account: 'account01' };
    User.findById.mockResolvedValue(mockUser);

    const result = await UserService.getUserInfo('1');
    expect(result.message).toBe('成功');
    expect(result.data).toEqual({
      id: 1,
      email: 'user@example.com',
      username: 'user',
      account: 'account01'
    });
  });

  it('should return internal error on exception', async () => {
    User.findById.mockRejectedValue(new Error('DB error'));

    const result = await UserService.getUserInfo('1');
    expect(result.message).toBe('伺服器錯誤');
    expect(result.error.code).toBe('E000_INTERNAL_ERROR');
  });
});
