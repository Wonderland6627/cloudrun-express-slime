// 通关奖励公式参数（与客户端 level_reward_config.json 保持一致）
// coinReward = floor(baseCoin + coinPerLevel * (levelId - 1))
// firstClearCoin = floor(coinReward * firstClearMultiplier)
// energyReturn = floor(levelEnergyConsume * energyReturnRate)
// adBonusCoin = coinReward * (adMultiplier - 1)
module.exports = {
  baseCoin: 15,
  coinPerLevel: 5,
  firstClearMultiplier: 3.0,
  energyReturnRate: 0.3,
  levelEnergyConsume: 10,
  adMultiplier: 2
};
