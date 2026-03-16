// 推关激励宝箱控制器
const levelChestService = require('../services/levelChestService');
const { success } = require('../middlewares/response');
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * POST /api/minigame/claimLevelChest
 * Body: { chestLevelId: number }
 */
async function claimLevelChest(req, res, next) {
  try {
    const openid = req.user.openid;
    const { chestLevelId } = req.body;

    if (chestLevelId == null || typeof chestLevelId !== 'number') {
      throw new AppError('chestLevelId is required and must be a number', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }

    const result = await levelChestService.claimLevelChest(openid, chestLevelId);
    return success(res, result, 'Claim level chest success');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  claimLevelChest,
};
