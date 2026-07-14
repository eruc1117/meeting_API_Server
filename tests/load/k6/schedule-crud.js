// 行事曆 CRUD 綜合負載測試
// 測試目標：10,000 VU 持續 10 分鐘，驗證建立 / 查詢行程的效能
//
// 執行方式：
//   k6 run tests/load/k6/schedule-crud.js
//   TEST_ACCOUNT=myuser@test.com TEST_PASSWORD=MyPass1 k6 run tests/load/k6/schedule-crud.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL        || 'http://localhost:3000';
const ACCOUNT  = __ENV.TEST_ACCOUNT    || 'loadtest@test.com';
const PASSWORD = __ENV.TEST_PASSWORD   || 'Test1234!';

export const options = {
  vus:      10000,
  duration: '10m',
  thresholds: {
    'http_req_duration{type:create}': ['p(95)<800'],
    'http_req_duration{type:query}':  ['p(95)<300'],
    'http_req_duration{type:update}': ['p(95)<500'],
    http_req_failed:                  ['rate<0.02'],
  },
};

// setup 階段：先登入取得 token（所有 VU 共用同一組測試帳號）
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ account: ACCOUNT, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const token = res.json('data.token');
  if (!token) throw new Error(`登入失敗，請確認帳號密碼。HTTP ${res.status}: ${res.body}`);
  return { token };
}

export default function (data) {
  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  group('建立行程', function () {
    const now   = new Date();
    const start = new Date(now.getTime() + __VU * 3600000).toISOString();
    const end   = new Date(now.getTime() + __VU * 3600000 + 1800000).toISOString();

    const res = http.post(
      `${BASE_URL}/api/schedule`,
      JSON.stringify({
        title:     `測試活動 ${__VU}-${__ITER}`,
        start_time: start,
        end_time:   end,
        is_public:  false,
      }),
      { headers, tags: { type: 'create' } }
    );

    check(res, { '建立成功': (r) => r.status === 201 });
  });

  group('查詢行程', function () {
    const res = http.post(
      `${BASE_URL}/api/schedule/query`,
      JSON.stringify({
        start_time: '2026-01-01T00:00:00Z',
        end_time:   '2026-12-31T23:59:59Z',
      }),
      { headers, tags: { type: 'query' } }
    );

    check(res, { '查詢成功': (r) => r.status === 200 });
  });

  sleep(Math.random() * 2 + 0.5);  // 0.5 ~ 2.5 秒隨機 think time
}
