// 认证中间件 - 仅支持token验证和测试模式
const { verifyToken, extractTokenFromRequest } = require('../utils/tokenManager');
const { PLATFORM_TYPES } = require('../utils/platformAuth');
const { unauthorized } = require('./response');

/**
 * 检查是否为测试模式
 * @param {Object} req - Express请求对象
 * @returns {boolean} 是否为测试模式
 */
function isTestMode(req) {
  // 检查环境变量
  if (process.env.ENABLE_TEST_MODE === 'true' || process.env.NODE_ENV === 'development') {
    // 检查测试token
    const testToken = req.headers['x-test-token'] || req.body?.testToken;
    if (testToken === process.env.TEST_TOKEN || process.env.TEST_TOKEN === 'any') {
      return true;
    }
  }
  return false;
}

/**
 * 认证中间件 - 验证token
 * 仅支持token验证和测试模式
 * 将用户信息附加到req.user
 */
function authMiddleware(req, res, next) {
  // 测试模式：允许通过
  if (isTestMode(req)) {
    const testOpenid = req.headers['x-test-openid'] || req.body?.testOpenid || 'test_user';
    req.user = {
      openid: testOpenid,
      platform: PLATFORM_TYPES.TEST,
      isTestMode: true
    };
    return next();
  }
  
  // Token验证
  const token = extractTokenFromRequest(req);
  if (!token) {
    return unauthorized(res, 'Authentication required. Please provide a valid token or enable test mode.');
  }
  
  const payload = verifyToken(token);
  if (!payload || !payload.openid) {
    return unauthorized(res, 'Invalid or expired token. Please login again.');
  }
  
  // 将用户信息附加到请求对象
  req.user = {
    openid: payload.openid,
    platform: payload.platform || PLATFORM_TYPES.WECHAT,
    session_key: payload.session_key
  };
  
  next();
}

/**
 * 可选认证中间件 - 如果提供了token则验证，否则跳过
 */
function optionalAuthMiddleware(req, res, next) {
  // 测试模式
  if (isTestMode(req)) {
    const testOpenid = req.headers['x-test-openid'] || req.body?.testOpenid || 'test_user';
    req.user = {
      openid: testOpenid,
      platform: PLATFORM_TYPES.TEST,
      isTestMode: true
    };
    return next();
  }
  
  // 尝试token验证
  const token = extractTokenFromRequest(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.openid) {
      req.user = {
        openid: payload.openid,
        platform: payload.platform || PLATFORM_TYPES.WECHAT,
        session_key: payload.session_key
      };
      return next();
    }
  }
  
  // 没有认证信息，继续执行（可选认证）
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};

