// 货币控制器层
const currencyService = require('../services/currencyService');
const { success } = require('../middlewares/response');
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * POST /api/minigame/addCurrency
 * 增加用户货币（通用接口，支持多种货币类型）
 * 请求参数：
 * {
 *   "currencyType": "coin",    // 必填，货币类型（如：'coin', 'diamond'）
 *   "amount": 100,              // 必填，增加的货币数量
 *   "source": "level_reward",   // 必填，货币来源
 *   "metadata": {               // 可选，额外数据
 *     "levelId": 1
 *   }
 * }
 */
async function addCurrency(req, res, next) {
  try {
    const openid = req.user.openid;  // 从认证中间件获取，确保是用户本人
    const { currencyType, amount, source, metadata } = req.body;
    
    if (!currencyType || !amount || !source) {
      throw new AppError('Missing required fields: currencyType, amount, source', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    
    const result = await currencyService.addCurrency(openid, currencyType, amount, source, metadata);
    return success(res, result, 'Add currency success');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/minigame/deductCurrency
 * 扣除用户货币（通用接口，支持多种货币类型）
 * 请求参数：
 * {
 *   "currencyType": "coin",    // 必填，货币类型（如：'coin', 'diamond'）
 *   "amount": 50,               // 必填，扣除的货币数量
 *   "reason": "refresh_reward" // 必填，扣除原因
 * }
 */
async function deductCurrency(req, res, next) {
  try {
    const openid = req.user.openid;  // 从认证中间件获取，确保是用户本人
    const { currencyType, amount, reason } = req.body;
    
    if (!currencyType || !amount || !reason) {
      throw new AppError('Missing required fields: currencyType, amount, reason', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    
    const result = await currencyService.deductCurrency(openid, currencyType, amount, reason);
    return success(res, result, 'Deduct currency success');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addCurrency,
  deductCurrency
};

