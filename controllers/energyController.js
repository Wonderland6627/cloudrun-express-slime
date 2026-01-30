// 体力值控制器
const energyService = require('../services/energyService');
const { success, validationError } = require('../middlewares/response');
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
      return validationError(res, 'change parameter is required');
    }
    
    if (typeof change !== 'number') {
      return validationError(res, 'change must be a number');
    }
    
    if (!source || typeof source !== 'string') {
      return validationError(res, 'source parameter is required and must be a string');
    }
    
    // 调用服务层更新体力值
    const result = await energyService.updateEnergy(openid, change, source);
    if (result.success) {
      // 成功：返回最新体力值
      return success(res, {
        energy: result.energy,
        success: true
      }, 'update energy success');
    } else {
      // 失败：返回当前体力值和错误信息
      return res.json({
        code: RESPONSE_CODE.ERROR,
        msg: result.message || 'Energy out of range',
        data: {
          energy: result.energy,
          success: false
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateEnergy
};

