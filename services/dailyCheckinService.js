// 每日签到服务层
const configManager = require('../config/luban/configManager');
const resourceService = require('./resourceService');
const rewardService = require('./rewardService');
const { RESOURCE_SOURCE } = require('../config/constants');

/**
 * 领取每日签到奖励（服务端原子结算）
 * @param {string} openid
 * @returns {Promise<{ rewards: Array<{ resourceType: number, amount: number, source: string }>, resources: Object }>}
 */
async function claimDailyCheckin(openid) {
  const gc = configManager.tables.tbglobalconfig.getData();
  if (!gc) throw new Error('TbGlobalConfig not loaded');

  const rewardId = gc.daily_checkin_reward_id;
  const { resourceUpdates } = rewardService.resolveReward(rewardId);

  const updates = resourceUpdates.map(u => ({
    resourceType: u.resourceType,
    change: u.change,
    source: RESOURCE_SOURCE.DAILY_CHECKIN,
  }));

  const updatedResources = await resourceService.batchUpdateResources(openid, updates);

  const rewards = resourceUpdates.map(u => ({
    resourceType: u.resourceType,
    amount: u.change,
    source: RESOURCE_SOURCE.DAILY_CHECKIN,
  }));

  console.log(`[DailyCheckin] User ${openid} claimed daily checkin: rewardId=${rewardId}, items=${rewards.length}`);

  return { rewards, resources: updatedResources };
}

module.exports = {
  claimDailyCheckin,
};
