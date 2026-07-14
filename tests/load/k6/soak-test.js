// 浸泡測試（Soak Test）
// 測試目標：1,000 VU 持續 2 小時，偵測記憶體洩漏與長時間穩定性
//
// 執行方式：
//   k6 run tests/load/k6/soak-test.js
//
// 觀測重點：
//   - Node.js heap 記憶體不應持續增長（pm2 monit 或 pm2 show backend 觀察）
//   - p95 延遲應全程維持穩定，不應隨時間上升
//   - DB 連線數不應累積

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL      || 'http://localhost:3000';
const ACCOUNT  = __ENV.TEST_ACCOUNT  || 'soak@test.com';
const PASSWORD = __ENV.TEST_PASSWORD || 'Test1234!';

export const options = {
  vus:      1000,
  duration: '2h',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ account: ACCOUNT, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: res.json('data.token') };
}

export default function (data) {
  const rand = Math.random();

  if (rand < 0.4) {
    // 40%：查詢用戶資訊
    const res = http.get(`${BASE_URL}/api/user/info`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    check(res, { 'user info ok': (r) => r.status === 200 });

  } else if (rand < 0.7) {
    // 30%：查詢行事曆
    const res = http.post(
      `${BASE_URL}/api/schedule/query`,
      JSON.stringify({
        start_time: '2026-01-01T00:00:00Z',
        end_time:   '2026-12-31T23:59:59Z',
      }),
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` } }
    );
    check(res, { 'schedule query ok': (r) => r.status === 200 });

  } else {
    // 30%：登入（模擬 token 更新）
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ account: ACCOUNT, password: PASSWORD }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(res, { 'login ok': (r) => r.status === 200 });
  }

  sleep(1);
}
