const UserController = require('../../controllers/UserController');
const UserService = require('../../services/UserService');

jest.mock('../../services/UserService');

describe('UserController.getUserInfo', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 with user data on success', async () => {
    const req = { query: { id: '1' }, user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    const mockResult = {
      message: '成功',
      data: { id: 1, email: 'user@example.com', username: 'user', account: 'account01' }
    };

    UserService.getUserInfo.mockResolvedValue(mockResult);

    await UserController.getUserInfo(req, res);

    expect(UserService.getUserInfo).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 403 if id does not match jwt user id', async () => {
    const req = { query: { id: '2' }, user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await UserController.getUserInfo(req, res);

    expect(UserService.getUserInfo).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: '查詢失敗，無權限查詢其他使用者資料',
      data: {},
      error: { code: 'E005_FORBIDDEN' }
    });
  });

  it('should return 400 if id is missing', async () => {
    const req = { query: {}, user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    const mockResult = {
      message: '查詢失敗，缺少必要資料',
      data: {},
      error: { code: 'E012_MISSING_FIELDS' }
    };

    UserService.getUserInfo.mockResolvedValue(mockResult);

    await UserController.getUserInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 404 if user not found', async () => {
    const req = { query: { id: '1' }, user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    const mockResult = {
      message: '查詢失敗，使用者不存在',
      data: {},
      error: { code: 'E007_NOT_FOUND' }
    };

    UserService.getUserInfo.mockResolvedValue(mockResult);

    await UserController.getUserInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
});
