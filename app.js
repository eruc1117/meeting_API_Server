const express = require('express');
const app = express();
const routes = require('./routes'); // 整合路由

app.use(express.json());
app.use('/api', routes); // 掛載統一前綴 /api



app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
