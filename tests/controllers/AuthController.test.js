const AuthController = require('../../controllers/AuthController');
const AuthService = require('../../services/AuthService');

// 模擬依賴
jest.mock('../../services/AuthService');

describe('AuthController.register', () => {
  it('should call AuthService.register and respond with correct status and body', async () => {
    // Arrange
    const req = {
      body: {
        email: 'user@example.com',
        account: 'username',
        password: 'password123'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      status: 201,
      body: {
        message: 'User created',
        user: { id: 1 },
        token: 'fake-jwt-token'
      }
    };

    AuthService.register.mockResolvedValue(mockResult);

    // Act
    await AuthController.register(req, res);

    // Assert
    expect(AuthService.register).toHaveBeenCalledWith('user@example.com', 'username', 'password123');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult.body);
  });
});

describe('AuthController.register - failure cases', () => {
  it('should return 400 if email format is invalid', async () => {
    const req = {
      body: {
        email: 'invalid-email',
        account: 'username',
        password: 'password123'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      status: 400,
      body: {
        message: 'Invalid email format'
      }
    };

    AuthService.register.mockResolvedValue(mockResult);

    await AuthController.register(req, res);

    expect(AuthService.register).toHaveBeenCalledWith('invalid-email', 'username', 'password123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(mockResult.body);
  });

  it('should return 409 if user already exists', async () => {
    const req = {
      body: {
        email: 'user@example.com',
        account: 'username',
        password: 'password123'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockResult = {
      status: 409,
      body: {
        message: 'User already exists'
      }
    };

    AuthService.register.mockResolvedValue(mockResult);

    await AuthController.register(req, res);

    expect(AuthService.register).toHaveBeenCalledWith('user@example.com', 'username', 'password123');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(mockResult.body);
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
      status: 200,
      body: {
        message: 'Login successful',
        user: { id: 1, email: 'user@example.com', username: 'username' },
        token: 'JWT-TOKEN'
      }
    });

    await AuthController.login(req, res);

    expect(AuthService.login).toHaveBeenCalledWith('user@example.com', 'password123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Login successful' }));
  });
});