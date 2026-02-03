// 体力值控制器
const energyService = require('../services/energyService');
const { success } = require('../middlewares/response');
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * 更新体力值接口
 * POST /api/minigame/updateEnergy
 * 请求参数：{ change: number, source: string }
 */
async function updateEnergy(req, res, next) {
  try {
    const openid = req.user.openid;
    const { change, source } = req.body;
    
    // 参数验证
    if (change === undefined || change === null) {
      throw new AppError('change parameter is required', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    
    if (typeof change !== 'number') {
      throw new AppError('change must be a number', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    
    if (!source || typeof source !== 'string') {
      throw new AppError('source parameter is required and must be a string', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    
    // 调用服务层更新体力值（与其他 controller 保持一致）
    const result = await energyService.updateEnergy(openid, change, source);
    return success(res, result, 'update energy success');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateEnergy
};

