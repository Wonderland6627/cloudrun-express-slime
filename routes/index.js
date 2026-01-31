var express = require('express');
var router = express.Router();
const { getVersionInfo } = require('../utils/version');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 * GET /api/version
 * 获取服务版本信息（用于验证部署版本）
 */
router.get('/api/version', function(req, res, next) {
  res.json({
    code: 0,
    data: getVersionInfo(),
    msg: 'success'
  });
});

/**
 * POST /api/time
 * 获取服务器时间
 */
router.post('/api/time', function(req, res, next) {
  const now = new Date();
  res.json({
    code: 0,
    data: {
      timestamp: now.getTime(),
      datetime: now.toISOString()
    },
    msg: 'success'
  });
});

/**
 * GET /health
 * 健康检查端点（用于云托管健康检查）
 */
router.get('/health', function(req, res, next) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
