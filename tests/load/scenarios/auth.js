'use strict';
/**
 * 登入壓力測試情境
 * 測試帳密錯誤、成功登入兩種 path 的 QPS 與延遲
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

module.exports = {
  title: '登入 API 壓力測試',
  url: `${BASE_URL}/api/auth/login`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    account: process.env.TEST_ACCOUNT || 'loadtest@test.com',
    password: process.env.TEST_PASSWORD || 'Test1234!',
  }),
  // autocannon 參數
  connections: parseInt(process.env.CONNECTIONS) || 50,
  duration: parseInt(process.env.DURATION) || 20,
  pipelining: 1,
};
