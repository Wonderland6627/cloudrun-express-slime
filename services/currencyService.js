// 货币服务层（业务逻辑）- 通用货币系统
const cloudbaseDB = require('../utils/cloudbaseDB');
const { CURRENCY_TYPES } = require('../config/constants');

/**
 * 货币类型枚举
 */
const CurrencyTypes = CURRENCY_TYPES;

/**
 * 增加货币（通用方法）
 * @param {string} openid - 用户openid
 * @param {string} currencyType - 货币类型（如：'coin', 'diamond'）
 * @param {number} amount - 增加的数量（必须 > 0）
 * @param {string} source - 货币来源（如：'daily_checkin', 'level_reward', 'first_clear'）
 * @param {Object} metadata - 额外元数据（可选，如关卡ID、签到天数等）
 * @returns {Promise<Object>} 更新结果
 */
async function addCurrency(openid, currencyType, amount, source, metadata = {}) {
  // 参数验证
  if (!amount || amount <= 0) {
    throw new Error('Currency amount must be greater than 0');
  }
  
  if (!currencyType || typeof currencyType !== 'string') {
    throw new Error('Currency type is required');
  }
  
  // 使用数据库原子操作
  const updatedUser = await cloudbaseDB.incrementCurrency(openid, currencyType, amount);
  
  // 记录日志
  console.log(`[Currency] User ${openid} added ${amount} ${currencyType} from ${source}. Current: ${updatedUser[currencyType] || 0}`);
  
  return {
    [currencyType]: updatedUser[currencyType] || 0,
    added: amount,
    source: source,
    metadata: metadata
  };
}

/**
 * 扣除货币（通用方法）
 * @param {string} openid - 用户openid
 * @param {string} currencyType - 货币类型（如：'coin', 'diamond'）
 * @param {number} amount - 扣除的数量（必须 > 0）
 * @param {string} reason - 扣除原因（如：'refresh_reward', 'buy_item'）
 * @returns {Promise<Object>} 更新结果
 */
async function deductCurrency(openid, currencyType, amount, reason) {
  // 参数验证
  if (!amount || amount <= 0) {
    throw new Error('Currency amount must be greater than 0');
  }
  
  if (!currencyType || typeof currencyType !== 'string') {
    throw new Error('Currency type is required');
  }
  
  // 使用数据库原子操作（带余额检查）
  const updatedUser = await cloudbaseDB.decrementCurrency(openid, currencyType, amount);
  
  // 记录日志
  console.log(`[Currency] User ${openid} deducted ${amount} ${currencyType} for ${reason}. Current: ${updatedUser[currencyType] || 0}`);
  
  return {
    [currencyType]: updatedUser[currencyType] || 0,
    deducted: amount,
    reason: reason
  };
}

// 便捷方法：金币操作（向后兼容）
async function addCoin(openid, amount, source, metadata = {}) {
  return await addCurrency(openid, CurrencyTypes.COIN, amount, source, metadata);
}

async function deductCoin(openid, amount, reason) {
  return await deductCurrency(openid, CurrencyTypes.COIN, amount, reason);
}

module.exports = {
  addCurrency,
  deductCurrency,
  addCoin,
  deductCoin,
  CURRENCY_TYPES: CurrencyTypes
};

