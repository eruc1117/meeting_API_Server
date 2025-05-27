const AuthController = require('../../controllers/AuthController');
const AuthService = require('../../services/AuthService');

// 模擬依賴
jest.mock('../../services/AuthService');

describe('AuthController.register', () => {

  const mockUserInfo = {
    email: 'user@example.com',
    account: 'account',
    username: 'username',
    password: 'password123',
    passwordChk: 'password123'
  }

  it('should call AuthService.register and respond with correct status and body', async () => {
    // Arrange
    const req = {
      body: mockUserInfo
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      message: '使用者註冊成功',
      data: {
        user: { id: 1 },
        token: "jwt-token"
      }
    };

    AuthService.register.mockResolvedValue(mockResult);

    // Act
    await AuthController.register(req, res);

    // Assert
    expect(AuthService.register).toHaveBeenCalledWith(mockUserInfo.email, mockUserInfo.username, mockUserInfo.account, mockUserInfo.password, mockUserInfo.passwordChk);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 400 if email format is invalid', async () => {
    const req = {
      body: {
        email: 'invalid-email',
        account: 'account',
        username: 'username',
        password: 'password123',
        passwordChk: 'password123'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      message: '電子信箱格式錯誤',
      data: {},
      error: { code: 'E002_INVALID_EMAIL' }
    };

    AuthService.register.mockResolvedValue(mockResult);

    await AuthController.register(req, res);

    expect(AuthService.register).toHaveBeenCalledWith(mockUserInfo.email, mockUserInfo.username, mockUserInfo.account, mockUserInfo.password, mockUserInfo.passwordChk);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 409 if user already exists', async () => {
    const req = {
      body: mockUserInfo
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      message: '註冊帳號已存在',
      data: {},
      error: { code: 'E001_USER_EXISTS' }
    };

    AuthService.register.mockResolvedValue(mockResult);

    await AuthController.register(req, res);

    expect(AuthService.register).toHaveBeenCalledWith(mockUserInfo.email, mockUserInfo.username, mockUserInfo.account, mockUserInfo.password, mockUserInfo.passwordChk);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return an error if the password does not match during checkPassword', async () => {
    const req = {
      body: {
        email: 'invalid-email',
        account: 'account',
        username: 'username',
        password: 'password123',
        passwordChk: 'elsePassword'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      message: '密碼和確認密碼不同',
      data: {},
      error: { code: 'E009_PASSWORD_NOT_SAME' }
    };

    AuthService.register.mockResolvedValue(mockResult);

    await AuthController.register(req, res);

    expect(AuthService.register).toHaveBeenCalledWith(mockUserInfo.email, mockUserInfo.username, mockUserInfo.account, mockUserInfo.password, mockUserInfo.passwordChk);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

});


describe('AuthController.login', () => {
  it('should call AuthService.login and respond with correct status and body', async () => {
    const req = {
      body: {
        account: 'user@example.com',
        password: 'password123'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    AuthService.login.mockResolvedValue({
      message: '登入成功',
      user: {
        id: 1,
        email: "user@example.com",
        username: "username"
      },
      token: "jwt-token"
    });

    await AuthController.login(req, res);

    expect(AuthService.login).toHaveBeenCalledWith('user@example.com', 'password123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '登入成功' }));
  });

  it('should return error if user is not exist ', async () => {
    const req = {
      body: {
        account: 'user@example.com',
        password: 'password123'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      message: '登入失敗，帳號不存在',
      error: {
        code: "E008_ACCOUNT_NOT_EXIST"
      }
    };

    AuthService.login.mockResolvedValue(mockResult);

    await AuthController.login(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 401 if user not found or password incorrect', async () => {
    const req = {
      body: {
        account: 'user@example.com',
        password: 'password123'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      message: '登入失敗，帳號密碼錯誤',
      error: {
        code: "E003_INVALID_CREDENTIALS"
      }
    };

    AuthService.login.mockResolvedValue(mockResult);

    await AuthController.login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

});