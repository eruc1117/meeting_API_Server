require('./utils/validateEnv')();
const app = require('./app');

const PORT = process.env.PORT || 3000;
// 容器內需綁 0.0.0.0 才能被 port mapping 轉發，故允許 HOST 覆寫；
// 未設定時維持原行為（production 綁 loopback，前面接反向代理）。
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0');

app.listen(PORT, host, () => {
  console.log(`Server running on http://${host}:${PORT}`);
});
