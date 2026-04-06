// 测试模式中间件 - 仅在 ENABLE_TEST_MODE=true 时放行
const { error } = require('./response');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * 测试模式守卫，生产环境不设 ENABLE_TEST_MODE，接口自动不可用
 */
function testModeMiddleware(req, res, next) {
  if (process.env.ENABLE_TEST_MODE !== 'true') {
    return error(res, 'This endpoint is only available in test mode', RESPONSE_CODE.ERROR, 403);
  }
  next();
}

module.exports = { testModeMiddleware };
