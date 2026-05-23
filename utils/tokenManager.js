// Token管理器 - 使用标准JWT库生成和验证认证token
const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

// Token配置
const DEFAULT_TOKEN_SECRET = 'UEVXc5P9juJB4nzzoajjIYLio8AY36LFeS3gZIXD9bfr0lJW7QQzrGx3c1Xyj4nU';
const TOKEN_SECRET = process.env.TOKEN_SECRET || DEFAULT_TOKEN_SECRET;
const TOKEN_EXPIRE_TIME = '7d'; // 7天过期时间（JWT标准格式）
const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'release';

if (isProduction && TOKEN_SECRET === DEFAULT_TOKEN_SECRET) {
  throw new Error('TOKEN_SECRET is required in production environment');
}

if (!process.env.TOKEN_SECRET) {
  logger.warn('TOKEN_SECRET is not set, using insecure default secret (non-production only)');
}

/**
 * 生成JWT Token
 * @param {Object} payload - Token负载数据 {openid, platform, session_key}
 * @returns {string} JWT格式的token
 */
function generateToken(payload) {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000) // 签发时间（JWT标准字段）
  };
  
  // 使用标准JWT库生成token
  return jwt.sign(tokenPayload, TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRE_TIME,
    algorithm: 'HS256' // 使用HMAC-SHA256算法
  });
}

/**
 * 验证JWT Token
 * @param {string} token - 要验证的token
 * @returns {Object|null} 解析后的payload，如果无效则返回null
 */
function verifyToken(token) {
  if (!token) {
    return null;
  }
  
  try {
    // 使用标准JWT库验证token
    // verify方法会自动检查签名和过期时间
    const decoded = jwt.verify(token, TOKEN_SECRET, {
      algorithms: ['HS256']
    });
    
    return decoded;
  } catch (error) {
    // JWT验证失败（签名错误、过期、格式错误等）
    if (error.name === 'TokenExpiredError') {
      logger.error('Token expired', { expiredAt: error.expiredAt });
    } else if (error.name === 'JsonWebTokenError') {
      logger.error('Invalid token', { error: error.message });
    } else {
      logger.error('Token verification error', { error: error.message });
    }
    return null;
  }
}

/**
 * 从请求中提取token
 * @param {Object} req - Express请求对象
 * @returns {string|null} token字符串
 */
function extractTokenFromRequest(req) {
  // 优先从Authorization header获取 (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 从自定义header获取
  if (req.headers['x-auth-token']) {
    return req.headers['x-auth-token'];
  }
  
  // 从body获取
  if (req.body && req.body.token) {
    return req.body.token;
  }
  
  // 从query获取
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  return null;
}

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromRequest
};

