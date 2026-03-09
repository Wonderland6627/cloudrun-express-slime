// 每日签到控制器
const dailyCheckinService = require('../services/dailyCheckinService');
const { success } = require('../middlewares/response');

/**
 * POST /api/minigame/claimDailyCheckin
 */
async function claimDailyCheckin(req, res, next) {
  try {
    const openid = req.user.openid;
    const result = await dailyCheckinService.claimDailyCheckin(openid);
    return success(res, result, 'Claim daily checkin success');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  claimDailyCheckin,
};
