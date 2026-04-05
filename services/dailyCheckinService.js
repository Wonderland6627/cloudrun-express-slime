// 每日签到服务层
const { logger } = require('../utils/logger');
const configManager = require('../config/luban/configManager');
const resourceService = require('./resourceService');
const goodsService = require('./goodsService');
const rewardService = require('./rewardService');
const { RESOURCE_SOURCE } = require('../config/constants');

/**
 * 领取每日签到奖励（服务端原子结算）
 * @param {string} openid
 * @returns {Promise<{ rewards: Array, resources: Object, goods: Object }>}
 */
async function claimDailyCheckin(openid) {
  const gc = configManager.tables.tbglobalconfig.getData();
  if (!gc) throw new Error('TbGlobalConfig not loaded');

  const rewardId = gc.daily_checkin_reward_id;
  const { resourceUpdates, goodsUpdates } = rewardService.resolveReward(rewardId);

  // 处理资源奖励
  const resUpdates = resourceUpdates.map(u => ({
    resourceType: u.resourceType,
    change: u.change,
    source: RESOURCE_SOURCE.DAILY_CHECKIN,
  }));
  const updatedResources = await resourceService.batchUpdateResources(openid, resUpdates);

  // 处理物品奖励
  const gdsUpdates = goodsUpdates.map(u => ({
    goodsId: u.goodsId,
    change: u.change,
    source: RESOURCE_SOURCE.DAILY_CHECKIN,
  }));
  const updatedGoods = gdsUpdates.length > 0
    ? await goodsService.batchAddGoods(openid, gdsUpdates)
    : undefined;

  const rewards = rewardService.buildRewardEntries(
    resourceUpdates,
    goodsUpdates,
    RESOURCE_SOURCE.DAILY_CHECKIN
  );

  logger.info(`[DailyCheckin] Claimed daily checkin: rewardId=${rewardId}, items=${rewards.length}`, { openid });

  return { rewards, resources: updatedResources, goods: updatedGoods };
}

module.exports = {
  claimDailyCheckin,
};
