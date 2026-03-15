#!/usr/bin/env node
'use strict';

/**
 * 負載測試執行器
 *
 * 用法：
 *   node tests/load/run-test.js [scenario] [options]
 *
 * 情境（scenario）：
 *   auth       登入 API 壓力測試（預設）
 *   schedule   行事曆查詢壓力測試（需先有帳號）
 *   spike      突發峰值測試
 *   soak       浸泡測試（長時間穩定性）
 *
 * 選項（環境變數）：
 *   BASE_URL=http://localhost:3000
 *   CONNECTIONS=50          並發連線數
 *   DURATION=20             測試持續秒數
 *   TEST_ACCOUNT=xxx        測試帳號
 *   TEST_PASSWORD=xxx       測試密碼
 *
 * 範例：
 *   node tests/load/run-test.js auth
 *   CONNECTIONS=200 DURATION=60 node tests/load/run-test.js auth
 *   node tests/load/run-test.js schedule
 */

const autocannon = require('autocannon');
const path = require('path');
const fs = require('fs');
const { generateMdReport } = require('./generate-report');
const { getToken, BASE_URL } = require('./scenarios/schedule');

const SCENARIO = process.argv[2] || 'auth';
const REPORT_DIR = path.join(__dirname, 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const CONNECTIONS = parseInt(process.env.CONNECTIONS) || 50;
const DURATION = parseInt(process.env.DURATION) || 20;

const SCENARIOS = {
  // ── 登入壓力測試 ────────────────────────────────────────────────────────────
  auth: async () => ({
    title: '登入 API — 壓力測試',
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account: process.env.TEST_ACCOUNT || 'loadtest@test.com',
      password: process.env.TEST_PASSWORD || 'Test1234!',
    }),
    connections: CONNECTIONS,
    duration: DURATION,
  }),

  // ── 行事曆查詢壓力測試 ──────────────────────────────────────────────────────
  schedule: async () => {
    console.log('取得測試 Token...');
    const token = await getToken();
    if (!token) throw new Error('無法取得 Token，請確認帳號密碼是否正確');
    console.log('Token 取得成功，開始壓測...\n');
    return {
      title: '行事曆查詢 — 壓力測試',
      url: `${BASE_URL}/api/schedules/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        start_time: '2026-01-01T00:00:00',
        end_time: '2026-12-31T23:59:59',
      }),
      connections: CONNECTIONS,
      duration: DURATION,
    };
  },

  // ── 突發峰值測試 ─────────────────────────────────────────────────────────────
  spike: async () => ({
    title: '突發峰值 — Spike Test',
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account: process.env.TEST_ACCOUNT || 'loadtest@test.com',
      password: process.env.TEST_PASSWORD || 'Test1234!',
    }),
    // 使用 autocannon 的 overallRate 模式模擬突發
    connections: 500,
    duration: 30,
    overallRate: 2000, // 突發 2000 RPS
  }),

  // ── 浸泡測試（長時間穩定性）───────────────────────────────────────────────────
  soak: async () => {
    console.log('取得測試 Token...');
    const token = await getToken();
    console.log('Token 取得成功，開始浸泡測試（120 秒）...\n');
    return {
      title: '浸泡測試 — Soak Test (2 min)',
      url: `${BASE_URL}/api/schedules/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ start_time: '2026-01-01T00:00:00', end_time: '2026-12-31T23:59:59' }),
      connections: parseInt(process.env.SOAK_CONNECTIONS) || 100,
      duration: parseInt(process.env.SOAK_DURATION) || 120,
    };
  },
};

async function main() {
  if (!SCENARIOS[SCENARIO]) {
    console.error(`未知情境：${SCENARIO}。可用情境：${Object.keys(SCENARIOS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n=== 負載測試：${SCENARIO.toUpperCase()} ===`);
  console.log(`並發連線：${CONNECTIONS}　測試時間：${DURATION}s\n`);

  const opts = await SCENARIOS[SCENARIO]();
  const instance = autocannon(opts);

  // 即時進度
  autocannon.track(instance, { renderProgressBar: true });

  instance.on('done', (result) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const jsonFile = path.join(REPORT_DIR, `${SCENARIO}-${timestamp}.json`);
    const mdFile   = path.join(REPORT_DIR, `${SCENARIO}-${timestamp}.md`);

    // 儲存 JSON 原始結果
    fs.writeFileSync(jsonFile, JSON.stringify(result, null, 2));

    // 產出 Markdown 報告
    generateMdReport(result, mdFile);

    console.log('\n\n=== 測試完成 ===');
    console.log(`JSON 報告：${jsonFile}`);
    console.log(`MD  報告：${mdFile}`);

    // 判斷是否通過閾值
    const p99 = result.latency.p99;
    const errRate = result.errors / (result.requests.total || 1);
    console.log('\n── 閾值判斷 ─────────────────────────');
    check('p99 延遲 < 1000ms', p99 < 1000, `實際: ${p99}ms`);
    check('錯誤率 < 5%', errRate < 0.05, `實際: ${(errRate * 100).toFixed(2)}%`);
    console.log('──────────────────────────────────────\n');
  });
}

function check(label, pass, detail) {
  const mark = pass ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${mark}  ${label}  (${detail})`);
}

main().catch((err) => {
  console.error('測試執行錯誤:', err.message);
  process.exit(1);
});
