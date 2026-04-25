// 通关奖励结算服务层
const { logger } = require('../utils/logger');
const cloudbaseDB = require('../utils/cloudbaseDB');
const resourceService = require('./resourceService');
const configManager = require('../config/luban/configManager');
const { RESOURCE_TYPE, RESOURCE_SOURCE, ITEM_TYPE } = require('../config/constants');

/**
 * 领取通关奖励（服务端统一结算）
 * @param {string} openid
 * @param {number} levelId
 * @param {boolean} watchedAd
 * @returns {Promise<{ rewards: Array<{itemType: number, itemId: number, amount: number, source: string}>, isFirstClear: boolean }>}
 */
async function claimLevelReward(openid, levelId, watchedAd) {
  const gc = configManager.tables.tbglobalconfig.getData();
  if (!gc) throw new Error('TbGlobalConfig not loaded');

  const coinRes = configManager.tables.tbresource.get(RESOURCE_TYPE.COIN);
  if (!coinRes) throw new Error('TbResource COIN not found');

  const user = await cloudbaseDB.findUserByOpenID(openid);
  if (!user) throw new Error('User not found');

  const isFirstClear = levelId > (user.progressLevelID || 0);

  // coinReward = floor(baseCoin + coinPerLevel * levelId)
  const coinReward = Math.floor(coinRes.default_value + gc.coin_per_level * levelId);

  // energyReturn = floor(levelEnergyConsume * energyReturnRate)
  const energyReturn = Math.floor(gc.level_energy_consume * gc.energy_return_rate);

  // firstClearCoin = floor(coinReward * firstClearMultiplier)
  const firstClearCoin = isFirstClear ? Math.floor(coinReward * gc.first_clear_multiplier) : 0;

  // adBonusCoin = coinReward * (adMultiplier - 1)
  const adBonusCoin = watchedAd ? coinReward * (gc.ad_multiplier - 1) : 0;

  const totalCoin = coinReward + firstClearCoin + adBonusCoin;

  const currentResources = resourceService.normalizeResources(user.resources);
  const currentEnergy = currentResources[RESOURCE_TYPE.ENERGY] ?? 0;

  const sets = {};
  if (isFirstClear) sets.progressLevelID = levelId;

  const resourceUpdates = [];
  if (totalCoin > 0) {
    resourceUpdates.push({
      resourceType: RESOURCE_TYPE.COIN,
      change: totalCoin,
      source: RESOURCE_SOURCE.LEVEL_REWARD,
    });
  }
  if (energyReturn > 0) {
    resourceUpdates.push({
      resourceType: RESOURCE_TYPE.ENERGY,
      change: energyReturn,
      source: RESOURCE_SOURCE.LEVEL_REWARD,
    });
  }

  const updatedResources = (Object.keys(sets).length > 0 || resourceUpdates.length > 0)
    ? await resourceService.batchUpdateResources(openid, resourceUpdates, sets)
    : currentResources;
  const finalEnergy = updatedResources[RESOURCE_TYPE.ENERGY] ?? currentEnergy;
  const finalEnergyReturn = Math.max(finalEnergy - currentEnergy, 0);

  const rewards = [];
  rewards.push({
    itemType: ITEM_TYPE.RESOURCE,
    itemId: RESOURCE_TYPE.COIN,
    amount: coinReward,
    source: RESOURCE_SOURCE.LEVEL_REWARD,
  });

  if (energyReturn > 0) {
    rewards.push({
      itemType: ITEM_TYPE.RESOURCE,
      itemId: RESOURCE_TYPE.ENERGY,
      amount: finalEnergyReturn,
      source: RESOURCE_SOURCE.LEVEL_REWARD,
    });
  }

  if (isFirstClear && firstClearCoin > 0) {
    rewards.push({
      itemType: ITEM_TYPE.RESOURCE,
      itemId: RESOURCE_TYPE.COIN,
      amount: firstClearCoin,
      source: RESOURCE_SOURCE.FIRST_CLEAR,
    });
  }

  if (watchedAd && adBonusCoin > 0) {
    rewards.push({
      itemType: ITEM_TYPE.RESOURCE,
      itemId: RESOURCE_TYPE.COIN,
      amount: adBonusCoin,
      source: RESOURCE_SOURCE.LEVEL_REWARD,
    });
  }

  logger.info(`[LevelReward] Claimed level ${levelId}: totalCoin=${totalCoin}, energy=${finalEnergyReturn}, isFirstClear=${isFirstClear}, watchedAd=${watchedAd}`, { openid });

  return { rewards, isFirstClear };
}

module.exports = {
  claimLevelReward
};
