const rateLimit = require('express-rate-limit');

// 全局速率限制：每个 IP 每分钟最多 60 次请求
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: -1, msg: 'Too many requests, please try again later.' },
  validate: { xForwardedForHeader: false, forwardedHeader: false },
});

// 登录接口限制：每个 IP 每分钟最多 10 次
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: -1, msg: 'Too many login attempts, please try again later.' },
  validate: { xForwardedForHeader: false, forwardedHeader: false },
});

module.exports = { globalLimiter, loginLimiter };
