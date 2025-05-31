const express = require('express');
const app = express();
const routes = require('./routes'); // 整合路由
const whiteList = require("./middlewares/ipWhitelist");
var cors = require('cors');
 


app.use(cors());
app.use(whiteList);
app.use(express.json());
app.use('/api', routes); // 掛載統一前綴 /api



module.exports = app;
