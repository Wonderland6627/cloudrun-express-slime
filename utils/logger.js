/**
 * Winston 日志系统配置
 * 
 * 功能说明：
 * 1. 记录所有 HTTP 请求和响应详情
 * 2. 支持业务日志记录（info、warn、error 等级别）
 * 3. 自动按小时切分日志文件，按日期组织目录
 * 4. 异步写入，不阻塞主业务逻辑
 * 
 * Unity 开发者使用指南：
 * - logger.info('用户登录成功', { userId: 123, username: 'test' });
 * - logger.warn('配置项缺失', { configKey: 'API_KEY' });
 * - logger.error('数据库连接失败', { error: err.message, stack: err.stack });
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 日志根目录（相对于工程根目录）
// 使用 path.join(__dirname, '..') 获取工程根目录，确保在任何环境下都一致
const LOG_ROOT_DIR = path.join(__dirname, '..', 'logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_ROOT_DIR)) {
  fs.mkdirSync(LOG_ROOT_DIR, { recursive: true });
}

/**
 * 获取日志级别标记
 * @param {string} level - 日志级别
 * @returns {string} 级别标记
 */
function getLevelTag(level) {
  const levelMap = {
    'error': '[E]',
    'warn': '[W]',
    'info': '[I]',
    'http': '[H]',
    'debug': '[D]'
  };
  return levelMap[level.toLowerCase()] || '[?]';
}

/**
 * 自定义日志格式
 * 格式：YYYY-MM-DD HH:mm:ss.SSS [标记] [LEVEL]: message {扩展参数JSON}
 */
const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  // 获取级别标记
  const levelTag = getLevelTag(level);
  
  // 处理扩展参数：如果有额外的元数据，转换为 JSON
  let metaStr = '';
  if (Object.keys(meta).length > 0) {
    // 过滤掉 Symbol 类型的属性（winston 内部属性）
    const cleanMeta = Object.keys(meta)
      .filter(key => typeof key === 'string')
      .reduce((obj, key) => {
        obj[key] = meta[key];
        return obj;
      }, {});
    
    if (Object.keys(cleanMeta).length > 0) {
      metaStr = ' ' + JSON.stringify(cleanMeta);
    }
  }
  
  return `${timestamp} ${levelTag} [${level.toUpperCase()}]: ${message}${metaStr}`;
});

/**
 * 按日期分组的日志传输配置
 * 文件路径示例：/app/logs/2026-01-17/server-2026-01-17-14.log
 * 
 * 配置说明：
 * - datePattern: 'YYYY-MM-DD-HH' - 按小时切分文件
 * - filename: 包含日期目录和文件名的完整路径
 * - maxSize: '20m' - 单个文件最大 20MB（超过会提前切分）
 * - maxFiles: '30d' - 保留 30 天的日志
 * - zippedArchive: true - 自动压缩旧日志节省空间
 */
const dailyRotateTransport = new DailyRotateFile({
  // 文件路径：按日期创建目录（YYYY-MM-DD），文件名按小时切分（server-YYYY-MM-DD-HH.log）
  filename: path.join(LOG_ROOT_DIR, '%DATE%.log'),
  // 日期格式：包含目录结构，YYYY-MM-DD 为文件夹，server-YYYY-MM-DD-HH 为文件名
  // 注意：[server-] 用方括号转义，防止被解析为日期格式
  datePattern: 'YYYY-MM-DD/[server-]YYYY-MM-DD-HH',
  // 不压缩旧日志，保持原始 .log 格式
  zippedArchive: false,
  // 单个文件最大 20MB
  maxSize: '20m',
  // 保留 30 天
  maxFiles: '30d',
  // 日志格式（包含毫秒级时间戳）
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    customFormat
  ),
  // 异步写入，不阻塞业务逻辑
  options: { flags: 'a' }
});

/**
 * 控制台输出配置
 */
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    customFormat
  )
});

/**
 * 创建 Winston Logger 实例
 * 
 * 级别说明（从高到低）：
 * - error: 严重错误，需要立即关注
 * - warn: 警告信息，可能影响功能
 * - info: 一般信息，业务流程记录
 * - http: HTTP 请求日志
 * - debug: 调试信息（生产环境不记录）
 */
const logger = winston.createLogger({
  // 默认记录 http 及以上级别
  level: process.env.NODE_ENV === 'production' ? 'http' : 'debug',
  // 传输方式：文件 + 控制台
  transports: [
    dailyRotateTransport,
    consoleTransport
  ],
  // 捕获未处理的 Promise 异常
  exitOnError: false
});

/**
 * 监听日志切分事件（可选，用于监控）
 */
dailyRotateTransport.on('new', (filename) => {
  logger.info('New log file created', { filename });
});

dailyRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename });
});

/**
 * 获取客户端真实 IP 地址
 * 去除 IPv6 前缀（::ffff:），返回纯净的 IPv4 地址
 * @param {Object} req - Express 请求对象
 * @returns {string} 客户端 IP 地址
 */
function getClientIP(req) {
  let ip = req.ip || req.connection.remoteAddress || '';
  
  // 去除 IPv4-mapped IPv6 前缀（::ffff:）
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip;
}

/**
 * HTTP 请求日志记录器（与 morgan 集成）
 * 
 * 使用方式：在 app.js 中作为 morgan 的 stream 参数
 * app.use(morgan(':method :url :status :response-time ms', { stream: httpLogger.stream }));
 */
const httpLogger = {
  // Morgan 会将日志写入这个 stream
  stream: {
    write: (message) => {
      // 去除末尾换行符，使用 http 级别记录
      logger.http(message.trim());
    }
  },
  
  /**
   * 详细记录 HTTP 请求和响应（自定义中间件使用）
   * 
   * 将请求和响应分开记录为两条日志：
   * 1. 请求开始时记录请求信息
   * 2. 响应结束时记录完整响应信息
   * 
   * 使用示例：
   * app.use(httpLogger.logRequestDetails);
   * 
   * @param {Object} req - Express 请求对象
   * @param {Object} res - Express 响应对象
   * @param {Function} next - Express next 函数
   */
  logRequestDetails: (req, res, next) => {
    // 记录请求开始时间
    const startTime = Date.now();
    
    // 1️⃣ 立即记录请求日志
    logger.http('HTTP Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: getClientIP(req),
      userAgent: req.get('user-agent'),
      query: req.query,
      body: req.body,
      headers: {
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? '[PRESENT]' : undefined // 不记录完整 token
      }
    });
    
    // 保存原始的 res.json 方法
    const originalJson = res.json.bind(res);
    
    // 重写 res.json 方法，拦截响应内容
    res.json = function(data) {
      // 计算响应时间
      const responseTime = Date.now() - startTime;
      
      // 2️⃣ 记录响应日志（完整内容）
      logger.http('HTTP Response', {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        // 完整的响应数据
        response: data
      });
      
      // 调用原始方法
      return originalJson(data);
    };
    
    next();
  }
};

/**
 * 全局 Logger 导出
 * 
 * Unity 开发者常用方法：
 * 
 * 1. 记录信息日志（业务流程）：
 *    logger.info('用户注册成功', { userId: 123, username: 'player1' });
 * 
 * 2. 记录警告日志（潜在问题）：
 *    logger.warn('Redis 连接失败，使用本地缓存', { error: err.message });
 * 
 * 3. 记录错误日志（严重问题）：
 *    logger.error('数据库写入失败', { 
 *      error: err.message, 
 *      stack: err.stack,
 *      userId: req.userId 
 *    });
 * 
 * 4. 记录调试日志（开发阶段）：
 *    logger.debug('计算结果', { input: [1,2,3], output: 6 });
 */
module.exports = {
  logger,        // 核心 logger 实例
  httpLogger     // HTTP 日志记录器
};
