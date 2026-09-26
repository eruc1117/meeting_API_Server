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
  // validateDateTime 除了格式，還要求日期落在「一年前 ～ 兩年後」（M-06）。
  // 舊案例寫死 2025-05-24，到 2026 年就落到範圍外而失敗；改用相對日期，並把範圍規則本身也測起來。
  const shift = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 19); };

  it('should return true for valid ISO 8601 datetime string within range', () => {
    expect(validator.validateDateTime(shift(7))).toBe(true);
  });

  it('should accept the same string with an explicit timezone', () => {
    expect(validator.validateDateTime(`${shift(7)}+08:00`)).toBe(true);
  });

  it('should reject dates more than one year in the past', () => {
    expect(validator.validateDateTime(shift(-400))).toBe(false);
  });

  it('should reject dates more than two years in the future', () => {
    expect(validator.validateDateTime(shift(800))).toBe(false);
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
