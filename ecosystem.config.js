/**
 * PM2 Ecosystem Config
 *
 * 啟動指令：
 *   pm2 start ecosystem.config.js           # 依環境啟動
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js          # 零停機重啟（rolling reload）
 *   pm2 monit                                # 即時監控
 *   pm2 logs backend                         # 查看日誌
 */

module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'server.js',

      // 每顆 CPU 核心啟一個 worker（等同 cluster mode）
      instances: 'max',
      exec_mode: 'cluster',

      // 記憶體洩漏自動重啟閾值
      max_memory_restart: '512M',

      // 提高 libuv thread pool，讓 bcrypt 等 CPU-bound 操作不擠佔主線程
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        UV_THREADPOOL_SIZE: 16,
        LOG_LEVEL: 'debug',
        DB_POOL_MAX: 10,
        GLOBAL_RATE_LIMIT: 300,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        UV_THREADPOOL_SIZE: 16,
        LOG_LEVEL: 'info',
        DB_POOL_MAX: 20,
        GLOBAL_RATE_LIMIT: 300,
      },

      // 異常退出自動重啟，最多重試 10 次，超過後停止
      max_restarts: 10,
      restart_delay: 1000,

      // 日誌路徑
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
