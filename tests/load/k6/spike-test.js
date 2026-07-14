// 突發峰值測試（Spike Test）
// 測試目標：模擬流量在 10 秒內從正常暴增至 50,000 VU，驗證系統能否自我恢復
//
// 執行方式：
//   k6 run tests/load/k6/spike-test.js
//
// 說明：
//   允許 429（Rate Limit 觸發）視為正常，重點觀察系統不崩潰且能恢復

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL      || 'http://localhost:3000';
const ACCOUNT  = __ENV.TEST_ACCOUNT  || 'loadtest@test.com';
const PASSWORD = __ENV.TEST_PASSWORD || 'Test1234!';

export const options = {
  stages: [
    { duration: '30s', target: 100   },  // 正常流量
    { duration: '10s', target: 50000 },  // 突然暴增（促銷 / 事件觸發）
    { duration: '1m',  target: 50000 },  // 維持峰值
    { duration: '10s', target: 100   },  // 回落
    { duration: '1m',  target: 100   },  // 觀察恢復
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'],  // 峰值允許放寬到 2 秒
    http_req_failed:   ['rate<0.05'],   // 峰值失敗率允許 5%
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ account: ACCOUNT, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, timeout: '10s' }
  );

  // 200 或 429（Rate Limit）都算正常，系統不應崩潰（5xx）
  check(res, {
    'no server error': (r) => r.status < 500,
    'ok or rate limited': (r) => r.status === 200 || r.status === 429,
  });
}
