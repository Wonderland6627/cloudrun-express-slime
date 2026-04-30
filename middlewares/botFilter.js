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
  '/config.php',
  '/install.php',
  '/setup.php',
  '/db/',
  '/mysql',
  '/sql',
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
];

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
    'gobuster', 'dirbuster', 'wpscan', 'joomla',
    'python-requests', 'go-http-client', 'curl/',
    'wget/', 'scrapy', 'httpclient',
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
  const lower = urlPath.toLowerCase();

  if (BLOCKED_PATHS_EXACT.includes(lower)) return true;
  if (BLOCKED_PATH_PREFIXES.some(prefix => lower.startsWith(prefix))) return true;
  if (BLOCKED_EXTENSIONS.some(ext => lower.endsWith(ext))) return true;

  return false;
}

let blockedCount = 0;
let lastLogTime = Date.now();
const LOG_INTERVAL_MS = 60 * 1000;

/**
 * 恶意请求快速过滤中间件
 * 放在所有中间件最前面，对明显的扫描请求直接返回，不消耗后续资源
 */
function botFilter(req, res, next) {
  const urlPath = req.path || req.url.split('?')[0];
  const ua = req.get('user-agent') || '';

  const blocked = isBlockedPath(urlPath) || isMaliciousUA(ua);

  if (!blocked) return next();

  blockedCount++;

  const now = Date.now();
  if (now - lastLogTime >= LOG_INTERVAL_MS) {
    logger.warn('Bot filter summary', {
      blockedInLastMinute: blockedCount,
      lastBlockedPath: urlPath,
      lastBlockedUA: ua.substring(0, 100),
    });
    blockedCount = 0;
    lastLogTime = now;
  }

  res.status(403).end();
}

module.exports = { botFilter };
