// 统一错误处理中间件
const { error } = require('./response');
const { RESPONSE_CODE } = require('../config/constants');
const { logger } = require('../utils/logger');
const { isLikelyProbeRequest } = require('./botFilter');

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, code = RESPONSE_CODE.ERROR, statusCode = 200) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isCustom = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 统一错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
function errorHandler(err, req, res, next) {
  const statusCode = Number(err.statusCode || err.status || 500);
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'release';
  const isProbeRequest = isLikelyProbeRequest(req);
  const hasExplicitClientStatus = statusCode >= 400 && statusCode < 500;
  const fallbackStatusCode = isProbeRequest ? 404 : statusCode;

  // 使用 Winston 记录错误日志（包含完整的堆栈跟踪）
  logger.error('API Error', {
    message: err.message,
    stack: err.stack,
    statusCode,
    fallbackStatusCode,
    isProbeRequest,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  // 自定义错误
  if (err.isCustom) {
    return error(res, err.message, err.code, err.statusCode);
  }

  if (hasExplicitClientStatus) {
    return error(res, err.message || 'Bad request', RESPONSE_CODE.ERROR, statusCode);
  }

  if (isProbeRequest) {
    return error(res, 'Not Found', RESPONSE_CODE.NOT_FOUND, 404);
  }

  const message = isProduction ? 'Internal server error' : (err.message || 'Internal server error');
  return error(res, message, RESPONSE_CODE.ERROR, 500);
}

module.exports = {
  AppError,
  errorHandler
};

