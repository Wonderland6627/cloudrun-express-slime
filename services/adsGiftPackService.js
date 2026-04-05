// 广告礼包领取服务
const configManager = require('../config/luban/configManager');
const resourceService = require('./resourceService');
const goodsService = require('./goodsService');
const rewardService = require('./rewardService');
const { RESOURCE_SOURCE } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * 领取广告礼包奖励（服务端原子结算）
 * @param {string} openid
 * @param {number} rewardId - 客户端从 GlobalConfig.adRewardPackIds 随机选取的奖励ID
 * @returns {Promise<{ rewards: Array, resources: Object, goods: Object }>}
 */
async function claimAdsGiftPack(openid, rewardId) {
  const gc = configManager.tables.tbglobalconfig.getData();
  if (!gc) throw new AppError('TbGlobalConfig not loaded', RESPONSE_CODE.ERROR, 500);

  const allowedIds = gc.ad_reward_pack_ids;
  if (!allowedIds || !allowedIds.includes(rewardId)) {
    throw new AppError(
      `Invalid rewardId: ${rewardId}, allowed: [${allowedIds}]`,
      RESPONSE_CODE.VALIDATION_ERROR,
      400
    );
  }

  const { resourceUpdates, goodsUpdates } = rewardService.resolveReward(rewardId);

  const resUpdates = resourceUpdates.map(u => ({
    resourceType: u.resourceType,
    change: u.change,
    source: RESOURCE_SOURCE.AD_REWARD,
  }));
  const updatedResources = await resourceService.batchUpdateResources(openid, resUpdates);

  const gdsUpdates = goodsUpdates.map(u => ({
    goodsId: u.goodsId,
    change: u.change,
    source: RESOURCE_SOURCE.AD_REWARD,
  }));
  const updatedGoods = gdsUpdates.length > 0
    ? await goodsService.batchAddGoods(openid, gdsUpdates)
    : undefined;

  const rewards = rewardService.buildRewardEntries(
    resourceUpdates,
    goodsUpdates,
    RESOURCE_SOURCE.AD_REWARD
  );

  console.log(`[AdsGiftPack] User ${openid} claimed ads gift pack: rewardId=${rewardId}, items=${rewards.length}`);

  return { rewards, resources: updatedResources, goods: updatedGoods };
}

module.exports = {
  claimAdsGiftPack,
};
