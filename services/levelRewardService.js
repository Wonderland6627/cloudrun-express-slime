// 通关奖励结算服务层
const cloudbaseDB = require('../utils/cloudbaseDB');
const rewardConfig = require('../config/levelRewardConfig');
const { ENERGY, CURRENCY_SOURCE, ENERGY_SOURCE } = require('../config/constants');

/**
 * 领取通关奖励（服务端统一结算）
 * @param {string} openid
 * @param {number} levelId
 * @param {boolean} watchedAd
 * @returns {Promise<{ rewards: Array<{type: string, amount: number, source: string}> }>}
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

  // 体力返还不超过上限
  const currentEnergy = user.energy || 0;
  const clampedEnergyReturn = Math.min(energyReturn, ENERGY.MAX - currentEnergy);
  const finalEnergyReturn = Math.max(clampedEnergyReturn, 0);

  // 原子更新：set 字段（首通时更新 progressLevelID）+ inc 字段（coin/energy）
  const sets = {};
  if (isFirstClear) sets.progressLevelID = levelId;

  const increments = {};
  if (totalCoin > 0) increments.coin = totalCoin;
  if (finalEnergyReturn > 0) increments.energy = finalEnergyReturn;

  if (Object.keys(sets).length > 0 || Object.keys(increments).length > 0) {
    await cloudbaseDB.batchUpdateAndIncrement(openid, sets, increments);
  }

  // 构建奖励明细
  const rewards = [];

  rewards.push({ type: 'coin', amount: coinReward, source: CURRENCY_SOURCE.LEVEL_REWARD });

  if (energyReturn > 0) {
    rewards.push({ type: 'energy', amount: finalEnergyReturn, source: ENERGY_SOURCE.LEVEL_REWARD });
  }

  if (isFirstClear && firstClearCoin > 0) {
    rewards.push({ type: 'coin', amount: firstClearCoin, source: CURRENCY_SOURCE.FIRST_CLEAR });
  }

  if (watchedAd && adBonusCoin > 0) {
    rewards.push({ type: 'coin', amount: adBonusCoin, source: CURRENCY_SOURCE.LEVEL_REWARD });
  }

  console.log(`[LevelReward] User ${openid} claimed level ${levelId}: totalCoin=${totalCoin}, energy=${finalEnergyReturn}, isFirstClear=${isFirstClear}, watchedAd=${watchedAd}`);

  return { rewards, isFirstClear };
}

module.exports = {
  claimLevelReward
};
