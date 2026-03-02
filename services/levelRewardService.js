// 通关奖励结算服务层
const cloudbaseDB = require('../utils/cloudbaseDB');
const resourceService = require('./resourceService');
const rewardConfig = require('../config/levelRewardConfig');
const { RESOURCE_TYPE, RESOURCE_CONFIG, RESOURCE_SOURCE } = require('../config/constants');

/**
 * 领取通关奖励（服务端统一结算）
 * @param {string} openid
 * @param {number} levelId
 * @param {boolean} watchedAd
 * @returns {Promise<{ rewards: Array<{resourceType: number, amount: number, source: string}>, isFirstClear: boolean }>}
 */
async function claimLevelReward(openid, levelId, watchedAd) {
  const user = await cloudbaseDB.findUserByOpenID(openid);
  if (!user) throw new Error('User not found');

  const isFirstClear = levelId > (user.progressLevelID || 0);

  // coinReward = floor(baseCoin + coinPerLevel * (levelId - 1))
  const coinReward = Math.floor(rewardConfig.baseCoin + rewardConfig.coinPerLevel * (levelId - 1));

  // energyReturn = floor(levelEnergyConsume * energyReturnRate)
  const energyReturn = Math.floor(rewardConfig.levelEnergyConsume * rewardConfig.energyReturnRate);

  // firstClearCoin = floor(coinReward * firstClearMultiplier)
  const firstClearCoin = isFirstClear ? Math.floor(coinReward * rewardConfig.firstClearMultiplier) : 0;

  // adBonusCoin = coinReward * (adMultiplier - 1)
  const adBonusCoin = watchedAd ? coinReward * (rewardConfig.adMultiplier - 1) : 0;

  const totalCoin = coinReward + firstClearCoin + adBonusCoin;

  const currentResources = user.resources || resourceService.getDefaultResources();
  const currentEnergy = currentResources[RESOURCE_TYPE.ENERGY] ?? RESOURCE_CONFIG[RESOURCE_TYPE.ENERGY].defaultValue;
  const energyMax = RESOURCE_CONFIG[RESOURCE_TYPE.ENERGY].max;
  const clampedEnergyReturn = Math.min(energyReturn, energyMax - currentEnergy);
  const finalEnergyReturn = Math.max(clampedEnergyReturn, 0);

  const sets = {};
  if (isFirstClear) sets.progressLevelID = levelId;

  const resourceIncrements = {};
  if (totalCoin > 0) resourceIncrements[RESOURCE_TYPE.COIN] = totalCoin;
  if (finalEnergyReturn > 0) resourceIncrements[RESOURCE_TYPE.ENERGY] = finalEnergyReturn;

  if (Object.keys(sets).length > 0 || Object.keys(resourceIncrements).length > 0) {
    await cloudbaseDB.batchUpdateAndIncrement(openid, sets, resourceIncrements);
  }

  const rewards = [];
  rewards.push({ resourceType: RESOURCE_TYPE.COIN, amount: coinReward, source: RESOURCE_SOURCE.LEVEL_REWARD });

  if (energyReturn > 0) {
    rewards.push({ resourceType: RESOURCE_TYPE.ENERGY, amount: finalEnergyReturn, source: RESOURCE_SOURCE.LEVEL_REWARD });
  }

  if (isFirstClear && firstClearCoin > 0) {
    rewards.push({ resourceType: RESOURCE_TYPE.COIN, amount: firstClearCoin, source: RESOURCE_SOURCE.FIRST_CLEAR });
  }

  if (watchedAd && adBonusCoin > 0) {
    rewards.push({ resourceType: RESOURCE_TYPE.COIN, amount: adBonusCoin, source: RESOURCE_SOURCE.LEVEL_REWARD });
  }

  console.log(`[LevelReward] User ${openid} claimed level ${levelId}: totalCoin=${totalCoin}, energy=${finalEnergyReturn}, isFirstClear=${isFirstClear}, watchedAd=${watchedAd}`);

  return { rewards, isFirstClear };
}

module.exports = {
  claimLevelReward
};
