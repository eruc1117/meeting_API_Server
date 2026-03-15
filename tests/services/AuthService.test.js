const AuthService = require("../../services/AuthService");
const User = require("../../models/User");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
    password: 'Password1',
    passwordChk: 'Password1'
  };

  it('should return error if email format is invalid', async () => {
    const result = await AuthService.register('Error Format', mockUser.username, mockUser.account, mockUser.password, mockUser.passwordChk);
    expect(result.message).toBe('電子信箱格式錯誤');
    expect(result.error.code).toBe('E002_INVALID_EMAIL');
  });

  it('should return error if user already exists', async () => {
    User.findByEmailOrUsername.mockResolvedValueOnce(true);

    const result = await AuthService.register(mockUser.email, mockUser.username, mockUser.account, mockUser.password, mockUser.passwordChk);

    expect(result.message).toBe('註冊帳號已存在');
    expect(result.error.code).toBe('E001_USER_EXISTS');
  });

  it('should return an error if the password does not match during checkPassword', async () => {
    const result = await AuthService.register(mockUser.email, mockUser.username, mockUser.account, mockUser.password, 'ElsePassword1');

    expect(result.message).toBe('密碼和確認密碼不同');
    expect(result.error.code).toBe('E009_PASSWORD_NOT_SAME');
  });

  it('should successfully create a new user and return a token', async () => {
    User.findByEmailOrUsername.mockResolvedValueOnce(false);
    User.create.mockResolvedValueOnce(1);
    bcrypt.hash.mockResolvedValueOnce('hashedpassword');
    jwt.sign.mockReturnValueOnce('JWT-TOKEN');

    const result = await AuthService.register(mockUser.email, mockUser.username, mockUser.account, mockUser.password, mockUser.passwordChk);

    expect(result.message).toBe('使用者註冊成功');
    expect(result.data.user.id).toBe(1);
    expect(result.data.token).toBe('JWT-TOKEN');
    expect(User.create).toHaveBeenCalledWith('user@example.com', 'username', 'account', 'hashedpassword');
    expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, process.env.SECRET, { expiresIn: '1h' });
  });
});


describe('AuthService.updatePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success when user_id and old password are correct', async () => {
    const mockUser = { id: 1, password_hash: 'hashedpw' };
    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('newHashedpw');
    User.updatePasswordById = jest.fn().mockResolvedValue();

    const result = await AuthService.updatePassword(1, 'OldPass1', 'NewPass1');

    expect(result.message).toBe('更新成功');
    expect(result.data).toEqual({});
    expect(bcrypt.compare).toHaveBeenCalledWith('OldPass1', 'hashedpw');
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1', 10);
  });

  it('should return E003 if user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    const result = await AuthService.updatePassword(999, 'OldPass1', 'NewPass1');

    expect(result.message).toBe('更新失敗，使用者不存在');
    expect(result.error.code).toBe('E003_INVALID_CREDENTIALS');
  });

  it('should return E003 if old password is incorrect', async () => {
    User.findById.mockResolvedValue({ id: 1, password_hash: 'hashedpw' });
    bcrypt.compare.mockResolvedValue(false);

    const result = await AuthService.updatePassword(1, 'WrongPass1', 'NewPass1');

    expect(result.message).toBe('更新失敗，帳號密碼錯誤');
    expect(result.error.code).toBe('E003_INVALID_CREDENTIALS');
  });

  it('should return E013 if new password is too weak', async () => {
    User.findById.mockResolvedValue({ id: 1, password_hash: 'hashedpw' });
    bcrypt.compare.mockResolvedValue(true);

    const result = await AuthService.updatePassword(1, 'OldPass1', 'weak');

    expect(result.message).toBe('新密碼強度不足，需至少 8 字元並包含大小寫英文及數字');
    expect(result.error.code).toBe('E013_WEAK_PASSWORD');
  });
});


describe('AuthService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success with token and user info', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      username: 'username',
      password_hash: 'hashedpw'
    };
    User.findByAccountOrEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock-token');

    const result = await AuthService.login('user@example.com', 'password123');

    expect(result.message).toBe('登入成功');
    expect(result.data.token).toBe('mock-token');
    expect(result.data.user.id).toBe(mockUser.id);
    expect(result.data.user.email).toBe(mockUser.email);
    expect(result.data.user.username).toBe(mockUser.username);
    expect(User.findByAccountOrEmail).toHaveBeenCalledWith('user@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpw');
  });

  it('should return error if user does not exist', async () => {
    User.findByAccountOrEmail.mockResolvedValue(null);
    const result = await AuthService.login('wrong@example.com', '123');
    expect(result.message).toBe('登入失敗，帳號不存在');
    expect(result.data).toEqual({});
    expect(result.error.code).toBe('E008_ACCOUNT_NOT_EXIST');
  });

  it('should return 401 if password is incorrect', async () => {
    User.findByAccountOrEmail.mockResolvedValue({ id: 1, password_hash: 'hash' });
    bcrypt.compare.mockResolvedValue(false);
    const result = await AuthService.login('user@example.com', '123');
    expect(result.message).toBe('登入失敗，帳號密碼錯誤');
    expect(result.data).toEqual({});
    expect(result.error.code).toBe('E003_INVALID_CREDENTIALS');
  });
});
