// 通关奖励控制器
const levelRewardService = require('../services/levelRewardService');
const { success } = require('../middlewares/response');
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * POST /api/minigame/claimLevelReward
 * 请求参数：{ levelId: number, watchedAd?: boolean }
 */
async function claimLevelReward(req, res, next) {
  try {
    const openid = req.user.openid;
    const { levelId, watchedAd } = req.body;

    if (!levelId || typeof levelId !== 'number') {
      throw new AppError('levelId is required and must be a number', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }

    const result = await levelRewardService.claimLevelReward(openid, levelId, !!watchedAd);
    return success(res, result, 'Claim level reward success');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  claimLevelReward
};
