// 通用奖励解析服务（内部使用，不对外暴露接口）
const configManager = require('../config/luban/configManager');
const { ITEM_TYPE } = require('../config/constants');

/**
 * 从 TbReward 解析奖励条目，按 item_type 分组返回
 * @param {number} rewardId - TbReward 表的 id
 * @returns {{ reward: Object, resourceUpdates: Array<{ resourceType: number, change: number }>, goodsUpdates: Array<{ goodsId: number, change: number }> }}
 */
function resolveReward(rewardId) {
  const reward = configManager.tables.tbreward.get(rewardId);
  if (!reward) throw new Error(`Reward not found: ${rewardId}`);

  const resourceUpdates = [];
  const goodsUpdates = [];
  for (const entry of reward.reward_items) {
    switch (entry.item_type) {
      case ITEM_TYPE.RESOURCE:
        resourceUpdates.push({
          resourceType: entry.item_id,
          change: entry.amount,
        });
        break;
      case ITEM_TYPE.GOODS:
        goodsUpdates.push({
          goodsId: entry.item_id,
          change: entry.amount,
        });
        break;
      default:
        console.warn(`[RewardService] Unknown item_type: ${entry.item_type}, rewardId: ${rewardId}`);
    }
  }
  return { reward, resourceUpdates, goodsUpdates };
}

/**
 * 统一奖励条目（与客户端 RewardItemData 一致：itemType + itemId + amount + source）
 * @param {Array<{ resourceType: number, change: number }>} resourceUpdates
 * @param {Array<{ goodsId: number, change: number }>} goodsUpdates
 * @param {string} source
 * @returns {Array<{ itemType: number, itemId: number, amount: number, source: string }>}
 */
function buildRewardEntries(resourceUpdates, goodsUpdates, source) {
  const items = [];
  for (const u of resourceUpdates) {
    items.push({
      itemType: ITEM_TYPE.RESOURCE,
      itemId: u.resourceType,
      amount: u.change,
      source,
    });
  }
  for (const u of goodsUpdates) {
    items.push({
      itemType: ITEM_TYPE.GOODS,
      itemId: u.goodsId,
      amount: u.change,
      source,
    });
  }
  return items;
}

module.exports = {
  resolveReward,
  buildRewardEntries,
};
