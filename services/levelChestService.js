// 推关激励宝箱服务层
const { logger } = require('../utils/logger');
const configManager = require('../config/luban/configManager');
const cloudbaseDB = require('../utils/cloudbaseDB');
const resourceService = require('./resourceService');
const goodsService = require('./goodsService');
const rewardService = require('./rewardService');
const { RESOURCE_SOURCE } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');

/**
 * 领取推关激励宝箱
 * @param {string} openid
 * @param {number} chestLevelId - 里程碑关卡ID（tblevelchest 表的 level_id）
 * @returns {Promise<{ rewards: Array, claimedLevelChests: number[], resources: Object, goods: Object }>}
 */
async function claimLevelChest(openid, chestLevelId) {
  // 1. 校验配置存在
  const allMilestones = configManager.tables.tblevelchest.getAll();
  const milestone = allMilestones.find(m => m.level_id === chestLevelId);
  if (!milestone) {
    throw new AppError(`Invalid chestLevelId: ${chestLevelId}`);
  }

  // 2. 查询用户数据
  const userData = await cloudbaseDB.findUserByOpenID(openid);
  if (!userData) throw new AppError('User not found');

  // 3. 校验已通关
  const progressLevelID = userData.progressLevelID || 0;
  if (progressLevelID < chestLevelId) {
    throw new AppError(`Level not cleared: need ${chestLevelId}, current ${progressLevelID}`);
  }

  // 4. 校验未领取
  const claimed = userData.claimedLevelChests || [];
  if (claimed.includes(chestLevelId)) {
    throw new AppError(`Level chest already claimed: ${chestLevelId}`);
  }

  // 5. 解析奖励
  const { resourceUpdates, goodsUpdates } = rewardService.resolveReward(milestone.reward_id);

  // 6. 原子更新：push chestLevelId + 增量资源
  const _ = cloudbaseDB.command;
  const resUpdates = resourceUpdates.map(u => ({
    resourceType: u.resourceType,
    change: u.change,
    source: RESOURCE_SOURCE.CHEST_REWARD,
  }));
  const updatedResources = await resourceService.batchUpdateResources(openid, resUpdates, {
    claimedLevelChests: _.push([chestLevelId]),
  });

  // 7. 处理物品奖励
  const gdsUpdates = goodsUpdates.map(u => ({
    goodsId: u.goodsId,
    change: u.change,
    source: RESOURCE_SOURCE.CHEST_REWARD,
  }));
  const updatedGoods = gdsUpdates.length > 0
    ? await goodsService.batchAddGoods(openid, gdsUpdates)
    : undefined;

  const rewards = rewardService.buildRewardEntries(
    resourceUpdates,
    goodsUpdates,
    RESOURCE_SOURCE.CHEST_REWARD
  );

  // 8. 重新读取最新的 claimedLevelChests
  const updatedUser = await cloudbaseDB.findUserByOpenID(openid);
  const updatedClaimed = updatedUser?.claimedLevelChests || [...claimed, chestLevelId];

  logger.info(`[LevelChest] Claimed level chest: chestLevelId=${chestLevelId}, rewardId=${milestone.reward_id}, items=${rewards.length}`, { openid });

  return { rewards, claimedLevelChests: updatedClaimed, resources: updatedResources, goods: updatedGoods };
}

module.exports = {
  claimLevelChest,
};
