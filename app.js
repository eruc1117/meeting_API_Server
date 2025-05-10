const express = require('express');
const app = express();
const routes = require('./routes'); // 整合路由

app.use(express.json());
app.use('/api', routes); // 掛載統一前綴 /api



module.exports = app;
