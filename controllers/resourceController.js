// 统一资源控制器 —— 替代原 currencyController + energyController
const resourceService = require('../services/resourceService');
const { success } = require('../middlewares/response');
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * POST /api/minigame/updateResource
 * 通用资源增减
 * Body: { resourceType: number, change: number, source: string }
 */
async function updateResource(req, res, next) {
  try {
    const openid = req.user.openid;
    const { resourceType, change, source } = req.body;

    if (resourceType === undefined || resourceType === null) {
      throw new AppError('resourceType is required', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    if (typeof resourceType !== 'number') {
      throw new AppError('resourceType must be a number', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    if (change === undefined || change === null || typeof change !== 'number') {
      throw new AppError('change is required and must be a number', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    if (!source || typeof source !== 'string') {
      throw new AppError('source is required and must be a string', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }

    const result = await resourceService.updateResource(openid, resourceType, change, source);
    return success(res, result, 'Update resource success');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/minigame/getResources
 * 获取用户所有资源
 */
async function getResources(req, res, next) {
  try {
    const openid = req.user.openid;
    const resources = await resourceService.getResources(openid);
    return success(res, { resources }, 'Get resources success');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateResource,
  getResources
};
