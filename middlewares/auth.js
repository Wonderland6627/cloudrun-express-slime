// 认证中间件 - 仅支持token验证
const { verifyToken, extractTokenFromRequest } = require('../utils/tokenManager');
const { PLATFORM_TYPES } = require('../utils/platformAuth');
const { unauthorized } = require('./response');

/**
 * 认证中间件 - 验证token（强制认证）
 * 将用户信息附加到req.user
 */
function authMiddleware(req, res, next) {
  // Token验证
  const token = extractTokenFromRequest(req);
  if (!token) {
    return unauthorized(res, 'Authentication required. Please provide a valid token.');
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

