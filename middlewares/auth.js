// 认证中间件
const { getOpenIdFromRequest } = require('../utils/wechatAuth');
const { unauthorized } = require('./response');

/**
 * 认证中间件 - 验证openid
 * 将openid附加到req.user.openid
 */
function authMiddleware(req, res, next) {
  const openid = getOpenIdFromRequest(req);
  
  if (!openid) {
    return unauthorized(res, 'openid is required (pass in header x-openid or body.openid)');
  }
  
  // 将openid附加到请求对象
  req.user = {
    openid: openid
  };
  
  next();
}

/**
 * 可选认证中间件 - 如果提供了openid则附加，否则跳过
 */
function optionalAuthMiddleware(req, res, next) {
  const openid = getOpenIdFromRequest(req);
  
  if (openid) {
    req.user = {
      openid: openid
    };
  }
  
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};

