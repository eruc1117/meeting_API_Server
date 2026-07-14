// 登入 API 負載測試
// 測試目標：從 1,000 VU 爬升至 100,000 VU，驗證系統最大承載
//
// 執行方式：
//   k6 run tests/load/k6/login-load.js
//   k6 run --out json=tests/load/reports/login-load-$(date +%Y%m%dT%H%M%S).json tests/load/k6/login-load.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m',  target: 1000   },  // 1 分鐘爬升到 1,000 VU
    { duration: '3m',  target: 10000  },  // 3 分鐘爬升到 10,000 VU
    { duration: '5m',  target: 100000 },  // 5 分鐘爬升到 100,000 VU
    { duration: '5m',  target: 100000 },  // 維持 100,000 VU 5 分鐘
    { duration: '2m',  target: 0      },  // 2 分鐘降回 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% 請求在 500ms 內完成
    http_req_failed:   ['rate<0.01'],  // 失敗率 < 1%
    errors:            ['rate<0.05'],
  },
};

export default function () {
  const payload = JSON.stringify({
    account:  `user_${__VU}@test.com`,
    password: 'Test1234!',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  const ok = check(res, {
    'status is 200':          (r) => r.status === 200,
    'has token':              (r) => r.json('data.token') !== undefined,
    'response time < 500ms':  (r) => r.timings.duration < 500,
  });

  errorRate.add(!ok);
  sleep(1);
}
