// Jest 設定
// - setupFiles：載入 .env.test（覆蓋 .env），並擋住「DB_NAME 不是 _test 結尾」的情況
// - globalSetup：建立測試資料庫（不存在時）並跑 migration 到最新
// - 覆蓋率門檻：statements 75%（CI 用 --coverage 時生效）
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  globalSetup: '<rootDir>/tests/global-setup.js',
  testPathIgnorePatterns: ['/node_modules/', '/tests/load/'],
  testTimeout: 15000,
  collectCoverageFrom: [
    'app.js',
    'controllers/**/*.js',
    'services/**/*.js',
    'middlewares/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    'db/**/*.js',
  ],
  coverageThreshold: { global: { statements: 75 } },
};
