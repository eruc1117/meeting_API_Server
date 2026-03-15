'use strict';
/**
 * 行事曆查詢壓力測試情境
 * 需先執行一次登入取得 token，再測查詢 API
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_ACCOUNT = process.env.TEST_ACCOUNT || 'loadtest@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test1234!';

async function getToken() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ account: TEST_ACCOUNT, password: TEST_PASSWORD });
    const url = new URL(`${BASE_URL}/api/auth/login`);
    const req = http.request(
      { hostname: url.hostname, port: url.port || 3000, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.data?.token || null);
          } catch { reject(new Error('Login response parse error')); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { getToken, BASE_URL };
