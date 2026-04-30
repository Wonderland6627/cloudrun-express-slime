// 加载环境变量（如果存在.env文件）
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var morgan = require('morgan');

// 引入自定义日志系统
const { logger, httpLogger } = require('./utils/logger');

var indexRouter = require('./routes/index');
var minigameRouter = require('./routes/minigame');

// 加载版本信息模块
const { getVersionString } = require('./utils/version');

// 安全中间件
const helmet = require('helmet');
const { botFilter } = require('./middlewares/botFilter');
const { globalLimiter } = require('./middlewares/rateLimiter');

var app = express();

// 信任一层反向代理（云托管环境），使 req.ip 获取真实客户端 IP
app.set('trust proxy', 1);

// 启动时输出版本信息（使用新的 logger）
logger.info('Server Starting', { version: getVersionString() });

// ============ Luban 配置表加载 ============
const configManager = require('./config/luban/configManager');
if (configManager.loaded) {
  const names = configManager.tableNames;
  logger.info('Luban config loaded', {
    tables: names,
    counts: names.map(t => `${t}: ${configManager.tables[t].count}`)
  });
} else {
  logger.warn('Luban config not loaded (data directory may be empty, run gen_code_bin_to_server first)');
}
// ==========================================

// ============ 安全防护中间件（最高优先级）============
app.use(botFilter);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(globalLimiter);
// ========================================

// ============ 日志中间件配置 ============
// 1. Morgan 基础日志（将输出流导向 winston）
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', { 
  stream: httpLogger.stream 
}));
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ============ 详细请求日志中间件（必须在 express.json() 之后）============
// 2. 详细请求日志中间件（记录 IP、请求参数、响应内容等）
// 注意：必须在 express.json() 之后，才能正确获取 req.body
app.use(httpLogger.logRequestDetails);
// ========================================
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/minigame', minigameRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// 统一错误处理中间件（必须在所有路由之后）
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

// ============ 全局异常处理 ============
// 捕获未处理的 Promise 异常
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise
  });
});

// 捕获未捕获的同步异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // 记录日志后优雅退出（可选，根据业务需求调整）
  // process.exit(1);
});
// ========================================

module.exports = app;
