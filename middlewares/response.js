// 统一响应格式化中间件
const { RESPONSE_CODE } = require('../config/constants');

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {string} msg - 响应消息
 * @returns {Object} 响应对象
 */
function success(res, data = null, msg = 'success') {
  return res.json({
    code: RESPONSE_CODE.SUCCESS,
    data,
    msg
  });
}

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} msg - 错误消息
 * @param {number} code - 错误码
 * @param {number} statusCode - HTTP状态码
 * @returns {Object} 响应对象
 */
function error(res, msg, code = RESPONSE_CODE.ERROR, statusCode = 200) {
  return res.status(statusCode).json({
    code,
    msg
  });
}

/**
 * 未授权响应
 * @param {Object} res - Express响应对象
 * @param {string} msg - 错误消息
 * @returns {Object} 响应对象
 */
function unauthorized(res, msg = 'Unauthorized') {
  return error(res, msg, RESPONSE_CODE.UNAUTHORIZED, 401);
}

/**
 * 未找到响应
 * @param {Object} res - Express响应对象
 * @param {string} msg - 错误消息
 * @returns {Object} 响应对象
 */
function notFound(res, msg = 'Not Found') {
  return error(res, msg, RESPONSE_CODE.NOT_FOUND, 404);
}

/**
 * 验证错误响应
 * @param {Object} res - Express响应对象
 * @param {string} msg - 错误消息
 * @returns {Object} 响应对象
 */
function validationError(res, msg = 'Validation Error') {
  return error(res, msg, RESPONSE_CODE.VALIDATION_ERROR, 400);
}

module.exports = {
  success,
  error,
  unauthorized,
  notFound,
  validationError
};

