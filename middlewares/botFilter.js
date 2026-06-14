const path = require('path');
const { logger } = require('../utils/logger');

// 路径黑名单前缀 - 常见 CMS/漏洞扫描路径
const BLOCKED_PATH_PREFIXES = [
  '/wp-',
  '/wordpress',
  '/phpmyadmin',
  '/pma',
  '/admin',
  '/xmlrpc',
  '/cgi-bin',
  '/actuator',
  '/.env',
  '/.git',
  '/.well-known/security.txt',
  '/vendor',
  '/telescope',
  '/laravel',
  '/drupal',
  '/joomla',
  '/magento',
  '/solr',
  '/console',
  '/manager',
  '/phpinfo',
  '/shell',
  '/backup',
  '/config',
  '/config.php',
  '/install.php',
  '/setup.php',
  '/db/',
  '/mysql',
  '/sql',
  '/.aws',
  '/.kube',
  '/web/.env',
  '/www/.env',
];

// 路径黑名单精确匹配
const BLOCKED_PATHS_EXACT = [
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
];

// 可疑文件扩展名
const BLOCKED_EXTENSIONS = [
  '.php',
  '.asp',
  '.aspx',
  '.jsp',
  '.cgi',
  '.pl',
  '.bak',
  '.sql',
  '.log',
  '.swp',
  '.yml',
  '.yaml',
];

/**
 * 提取原始路径（不带 query）
 * @param {import('express').Request} req
 * @returns {string}
 */
function extractRawPath(req) {
  const rawUrl = req.originalUrl || req.url || req.path || '/';
  const queryIndex = rawUrl.indexOf('?');
  return queryIndex >= 0 ? rawUrl.slice(0, queryIndex) : rawUrl;
}

/**
 * 安全 decode 路径，避免无效编码触发异常
 * @param {string} urlPath
 * @returns {string}
 */
function safeDecodePath(urlPath) {
  try {
    return decodeURIComponent(urlPath);
  } catch (error) {
    return urlPath;
  }
}

/**
 * 标准化请求路径，避免 //、\、../ 等形式绕过黑名单
 * @param {string} urlPath
 * @returns {string}
 */
function normalizeUrlPath(urlPath) {
  if (!urlPath) return '/';

  let normalized = safeDecodePath(String(urlPath)).replace(/\\/g, '/');
  normalized = normalized.replace(/\/{2,}/g, '/');

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  normalized = path.posix.normalize(normalized);
  if (normalized === '.' || !normalized) {
    return '/';
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

/**
 * 判断 User-Agent 是否明显异常
 * @param {string} ua
 * @returns {boolean}
 */
function isMaliciousUA(ua) {
  if (!ua) return true;
  if (ua.startsWith('http://') || ua.startsWith('https://')) return true;
  if (ua.length < 10) return true;

  const suspiciousPatterns = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab',
    'gobuster', 'dirbuster', 'wpscan', 'scrapy',
    'zmeu', 'w3af', 'nessus', 'openvas',
  ];
  const lowerUA = ua.toLowerCase();
  return suspiciousPatterns.some(p => lowerUA.includes(p));
}

/**
 * 判断路径是否在黑名单中
 * @param {string} urlPath
 * @returns {boolean}
 */
function isBlockedPath(urlPath) {
  const lower = normalizeUrlPath(urlPath).toLowerCase();

  if (BLOCKED_PATHS_EXACT.includes(lower)) return true;
  if (BLOCKED_PATH_PREFIXES.some(prefix => lower.startsWith(prefix))) return true;
  if (BLOCKED_EXTENSIONS.some(ext => lower.endsWith(ext))) return true;

  return false;
}

let blockedCount = 0;
let lastLogTime = Date.now();
const LOG_INTERVAL_MS = 60 * 1000;

/**
 * 预先挂载标准化路径，避免后续中间件看到不一致路径
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function attachNormalizedPath(req, res, next) {
  const rawPath = extractRawPath(req);
  req.rawPath = rawPath;
  req.normalizedPath = normalizeUrlPath(rawPath);
  next();
}

/**
 * 判断当前请求是否大概率是扫描/探测流量
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isLikelyProbeRequest(req) {
  const urlPath = req.normalizedPath || normalizeUrlPath(extractRawPath(req));
  const rawPath = req.rawPath || extractRawPath(req);
  const ua = req.get('user-agent') || '';

  if (isBlockedPath(urlPath) || isMaliciousUA(ua)) return true;
  if (!urlPath.startsWith('/api/') && rawPath.includes('//')) return true;

  return false;
}

/**
 * 恶意请求快速过滤中间件
 * 放在所有中间件最前面，对明显的扫描请求直接返回，不消耗后续资源
 */
function botFilter(req, res, next) {
  const urlPath = req.normalizedPath || normalizeUrlPath(extractRawPath(req));
  const ua = req.get('user-agent') || '';

  const blocked = isBlockedPath(urlPath) || isMaliciousUA(ua);

  if (!blocked) return next();

  blockedCount++;

  const now = Date.now();
  if (now - lastLogTime >= LOG_INTERVAL_MS) {
    logger.warn('Bot filter summary', {
      blockedInLastMinute: blockedCount,
      lastBlockedPath: urlPath,
      lastBlockedRawPath: req.rawPath || extractRawPath(req),
      lastBlockedUA: ua.substring(0, 100),
    });
    blockedCount = 0;
    lastLogTime = now;
  }

  res.status(403).end();
}

module.exports = {
  attachNormalizedPath,
  botFilter,
  isBlockedPath,
  isLikelyProbeRequest,
  normalizeUrlPath
};
