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

module.exports = router;
