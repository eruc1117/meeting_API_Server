const validator = require('../../utils/validator');

describe('validateEmail', () => {
  test('should return true for valid email', () => {
    const validEmail = 'user@example.com';
    expect(validator.validateEmail(validEmail)).toBe(true);
  });

  test('should return false for invalid email without "@" symbol', () => {
    const invalidEmail = 'userexample.com';
    expect(validator.validateEmail(invalidEmail)).toBe(false);
  });

  test('should return false for invalid email with spaces', () => {
    const invalidEmail = 'user @example.com';
    expect(validator.validateEmail(invalidEmail)).toBe(false);
  });

  test('should return false for invalid email without domain', () => {
    const invalidEmail = 'user@.com';
    expect(validator.validateEmail(invalidEmail)).toBe(false);
  });

  test('should return false for invalid email with multiple "@" symbols', () => {
    const invalidEmail = 'user@@example.com';
    expect(validator.validateEmail(invalidEmail)).toBe(false);
  });
});
