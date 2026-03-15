const app = require('./app');

const PORT = process.env.PORT || 3000;
const host = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0';

app.listen(PORT, host, () => {
  console.log(`Server running on http://${host}:${PORT}`);
});
