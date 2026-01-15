// 统一错误处理中间件
const { error } = require('./response');
const { RESPONSE_CODE } = require('../config/constants');

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
  // 记录错误日志
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // 自定义错误
  if (err.isCustom) {
    return error(res, err.message, err.code, err.statusCode);
  }
  
  // 默认错误处理
  // release环境隐藏详细错误信息，develop环境显示详细错误信息
  const message = process.env.NODE_ENV === 'release' 
    ? 'Internal server error' 
    : err.message;
  
  return error(res, message, RESPONSE_CODE.ERROR, 500);
}

module.exports = {
  AppError,
  errorHandler
};

