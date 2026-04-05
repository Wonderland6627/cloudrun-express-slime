// 广告礼包控制器
const adsGiftPackService = require('../services/adsGiftPackService');
const { success } = require('../middlewares/response');
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * POST /api/minigame/claimAdsGiftPack
 * Body: { rewardId: number }
 */
async function claimAdsGiftPack(req, res, next) {
  try {
    const openid = req.user.openid;
    const { rewardId } = req.body;

    if (!rewardId || typeof rewardId !== 'number') {
      throw new AppError('rewardId is required and must be a number', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }

    const result = await adsGiftPackService.claimAdsGiftPack(openid, rewardId);
    return success(res, result, 'Claim ads gift pack success');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  claimAdsGiftPack,
};
