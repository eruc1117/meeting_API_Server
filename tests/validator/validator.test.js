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

describe('isValidDateTimeString', () => {
  it('should return true for valid ISO 8601 datetime string', () => {
    expect(validator.validateDateTime('2025-05-24T09:00:00')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(validator.validateDateTime('')).toBe(false);
  });

  it('should return false for completely invalid string', () => {
    expect(validator.validateDateTime('not-a-date')).toBe(false);
  });

  it('should return false for date with invalid values', () => {
    expect(validator.validateDateTime('2025-13-32T25:61:61')).toBe(false);
  });
});
