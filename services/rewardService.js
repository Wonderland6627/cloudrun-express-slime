// 通用奖励解析服务（内部使用，不对外暴露接口）
const configManager = require('../config/luban/configManager');
const { ITEM_TYPE } = require('../config/constants');

/**
 * 从 TbReward 解析奖励条目为资源更新列表
 * @param {number} rewardId - TbReward 表的 id
 * @returns {{ reward: Object, resourceUpdates: Array<{ resourceType: number, change: number }> }}
 */
function resolveReward(rewardId) {
  const reward = configManager.tables.tbreward.get(rewardId);
  if (!reward) throw new Error(`Reward not found: ${rewardId}`);

  const resourceUpdates = [];
  for (const entry of reward.reward_items) {
    if (entry.item_type === ITEM_TYPE.RESOURCE) {
      resourceUpdates.push({
        resourceType: entry.item_id,
        change: entry.amount,
      });
    }
    // ITEM_TYPE.GOODS 预留
  }
  return { reward, resourceUpdates };
}

module.exports = {
  resolveReward,
};
