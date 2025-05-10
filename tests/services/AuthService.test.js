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

  it('should return error if email format is invalid', async () => {
    const result = await AuthService.register('user', 'invalid-email', 'username', 'password123');
    
    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Invalid email format');
  });

  it('should return error if user already exists', async () => {
    // Mock the response of the User.findByEmailOrUsername method to simulate an existing user
    User.findByEmailOrUsername.mockResolvedValueOnce(true);

    const result = await AuthService.register('user', 'user@example.com', 'username', 'password123');
    
    expect(result.status).toBe(409);
    expect(result.body.message).toBe('User already exists');
  });

  it('should successfully create a new user and return a token', async () => {
    // Mock the return value for User.create (new user ID)
    User.create.mockResolvedValueOnce(1);
    // Mock bcrypt.hash to simulate password hashing
    bcrypt.hash.mockResolvedValueOnce('hashedpassword');
    // Mock jwt.sign to return a token
    jwt.sign.mockReturnValueOnce('JWT-TOKEN');

    const result = await AuthService.register('user', 'user@example.com', 'username', 'password123');
    
    expect(result.status).toBe(201);
    expect(result.body.message).toBe('User created');
    expect(result.body.user.id).toBe(1);
    expect(result.body.token).toBe('JWT-TOKEN');
    expect(User.create).toHaveBeenCalledWith('user', 'user@example.com', 'username', 'hashedpassword');
    expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, process.env.SECRET, { expiresIn: '1h' });
  });
});
