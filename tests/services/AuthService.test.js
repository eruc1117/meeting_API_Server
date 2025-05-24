const AuthService = require("../../services/AuthService");
const User = require("../../models/User");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock the dependencies
jest.mock('../../models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    email: 'user@example.com',
    username: 'username',
    account: 'account',
    password: 'hashedpw',
    passwordChk: 'hashedpw'
  };

  it('should return error if email format is invalid', async () => {
    const result = await AuthService.register("Error Format", mockUser.account, mockUser.username, mockUser.password, mockUser.passwordChk);

    expect(result.message).toBe('電子信箱格式錯誤');
    expect(result.error.code).toBe('E002_INVALID_EMAIL');
  });

  it('should return error if user already exists', async () => {
    // Mock the response of the User.findByEmailOrUsername method to simulate an existing user
    User.findByEmailOrUsername.mockResolvedValueOnce(true);

    const result = await AuthService.register(mockUser.email, mockUser.account, mockUser.username, mockUser.password, mockUser.passwordChk);

    expect(result.message).toBe('註冊帳號已存在');
    expect(result.error.code).toBe('E001_USER_EXISTS');
  });

  it('should return an error if the password does not match during checkPassword', async () => {
    // Mock the response of the User.findByEmailOrUsername method to simulate an existing user
    User.findByEmailOrUsername.mockResolvedValueOnce(true);

    const result = await AuthService.register(mockUser.email, mockUser.account, mockUser.username, mockUser.password, "ElsePassword");

    expect(result.message).toBe('密碼和確認密碼不同');
    expect(result.error.code).toBe('E009_PASSWORD_NOT_SAME');
  });

  it('should successfully create a new user and return a token', async () => {
    // Mock the return value for User.create (new user ID)
    User.findByEmailOrUsername.mockReset();
    User.findByEmailOrUsername.mockResolvedValueOnce(false);
    User.create.mockResolvedValueOnce(1);
    // Mock bcrypt.hash to simulate password hashing
    bcrypt.hash.mockResolvedValueOnce('hashedpassword');
    // Mock jwt.sign to return a token
    jwt.sign.mockReturnValueOnce('JWT-TOKEN');

    const result = await AuthService.register(mockUser.email, mockUser.username, mockUser.account, mockUser.password, mockUser.passwordChk);


    expect(result.message).toBe('使用者註冊成功');
    expect(result.data.user.id).toBe(1);
    expect(result.data.token).toBe('JWT-TOKEN');
    expect(User.create).toHaveBeenCalledWith('user@example.com', 'username', 'account', 'hashedpassword');
    expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, process.env.SECRET, { expiresIn: '1h' });
  });
});


describe('AuthService.login', () => {
  it('should return success with token and user info', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: 'username',
      password_hash: 'hashedpw'
    };
    User.findByEmailOrUsername.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock-token');

    const result = await AuthService.login('user@example.com', 'password123');

    expect(result.token).toBe('mock-token');
    expect(result.user.id).toBe(mockUser.id);
    expect(result.user.email).toBe(mockUser.email);
    expect(result.user.username).toBe(mockUser.username);
    expect(User.findByEmailOrUsername).toHaveBeenCalledWith('user@example.com', 'user@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpw');
  });

  it('should return error if user is not exist ', async () => {
    User.findByEmailOrUsername.mockResolvedValue(null);
    const result = await AuthService.login('wrong@example.com', '123');
    expect(result.message).toBe('登入失敗，帳號不存在');
    expect(result.error.code).toBe('E008_ACCOUNT_NOT_EXIST');
  });

  it('should return 401 if user not found or password incorrect', async () => {
    User.findByEmailOrUsername.mockResolvedValue(true);
    bcrypt.compare.mockReset();
    bcrypt.compare.mockResolvedValue(false);
    const result = await AuthService.login('user@example.com', '123');
    expect(result.message).toBe('登入失敗，帳號密碼錯誤');
    expect(result.error.code).toBe('E003_INVALID_CREDENTIALS');
  });

});