const UserService = require('../../services/UserService');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('UserService.searchUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return E012 if q is missing', async () => {
    const result = await UserService.searchUsers(undefined);
    expect(result.message).toBe('查詢失敗，缺少必要資料');
    expect(result.error.code).toBe('E012_MISSING_FIELDS');
  });

  it('should return E012 if q is empty string', async () => {
    const result = await UserService.searchUsers('   ');
    expect(result.message).toBe('查詢失敗，缺少必要資料');
    expect(result.error.code).toBe('E012_MISSING_FIELDS');
  });

  it('should return matching users on success', async () => {
    const mockUsers = [
      { id: 1, username: '小明', email: 'ming@example.com' },
      { id: 5, username: '小明2', email: 'ming2@example.com' }
    ];
    User.searchByKeyword.mockResolvedValue(mockUsers);

    const result = await UserService.searchUsers('小明');
    expect(result.message).toBe('查詢成功');
    expect(result.data.users).toEqual(mockUsers);
    expect(User.searchByKeyword).toHaveBeenCalledWith('小明');
  });

  it('should return empty array if no users match', async () => {
    User.searchByKeyword.mockResolvedValue([]);

    const result = await UserService.searchUsers('notexist');
    expect(result.message).toBe('查詢成功');
    expect(result.data.users).toEqual([]);
  });

  it('should return E000 if DB throws', async () => {
    User.searchByKeyword.mockRejectedValue(new Error('DB error'));

    const result = await UserService.searchUsers('test');
    expect(result.message).toBe('伺服器錯誤');
    expect(result.error.code).toBe('E000_INTERNAL_ERROR');
  });
});

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
