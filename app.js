// 加载环境变量（如果存在.env文件）
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var minigameRouter = require('./routes/minigame');

// 加载版本信息模块
const { getVersionString } = require('./utils/version');

var app = express();

// 启动时输出版本信息
console.log('🚀 Server Starting -', getVersionString());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/minigame', minigameRouter);

// add default index.html
app.use(express.static(__dirname+"/public",{index:"index.html"}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// 统一错误处理中间件（必须在所有路由之后）
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
