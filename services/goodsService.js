// 物品服务层 —— 管理 goods 类型物品的增减
const cloudbaseDB = require('../utils/cloudbaseDB');
const { logger } = require('../utils/logger');
const configManager = require('../config/luban/configManager');

/**
 * 获取用户所有物品
 * @param {string} openid
 * @returns {Promise<Object>} goods map e.g. { 1001: 3, 1002: 1 }
 */
async function getGoods(openid) {
  const userData = await cloudbaseDB.findUserByOpenID(openid);
  if (!userData) throw new Error('User not found');
  return userData.goods || {};
}

/**
 * 获取单项物品数量
 * @param {string} openid
 * @param {number} goodsId
 * @returns {Promise<number>}
 */
async function getGoodsItem(openid, goodsId) {
  validateGoodsId(goodsId);
  const goods = await getGoods(openid);
  return goods[goodsId] ?? 0;
}

/**
 * 发放物品（奖励等场景）
 * @param {string} openid
 * @param {number} goodsId
 * @param {number} amount - 必须 > 0
 * @param {string} source
 * @returns {Promise<{ goodsId: number, value: number, change: number }>}
 */
async function addGoods(openid, goodsId, amount, source) {
  validateGoodsId(goodsId);
  if (amount <= 0) throw new Error('Add amount must be positive');

  const updatedUser = await cloudbaseDB.incrementGoods(openid, goodsId, amount);
  const finalValue = (updatedUser.goods && updatedUser.goods[goodsId]) ?? amount;

  logger.info(`[Goods] +${amount} goods(${goodsId}) from ${source}. Current: ${finalValue}`, { openid });
  return { goodsId, value: finalValue, change: amount };
}

/**
 * 消耗物品（含余量校验）
 * @param {string} openid
 * @param {number} goodsId
 * @param {number} amount - 必须 > 0
 * @param {string} source
 * @returns {Promise<{ goodsId: number, value: number, change: number }>}
 */
async function consumeGoods(openid, goodsId, amount, source) {
  validateGoodsId(goodsId);
  if (amount <= 0) throw new Error('Consume amount must be positive');

  const userData = await cloudbaseDB.findUserByOpenID(openid);
  if (!userData) throw new Error('User not found');

  const currentGoods = userData.goods || {};
  const currentValue = currentGoods[goodsId] ?? 0;
  if (currentValue < amount) {
    const name = getGoodsName(goodsId);
    throw new Error(`Insufficient ${name}. Current: ${currentValue}, Need: ${amount}`);
  }

  const updatedUser = await cloudbaseDB.incrementGoods(openid, goodsId, -amount);
  const finalValue = (updatedUser.goods && updatedUser.goods[goodsId]) ?? (currentValue - amount);

  logger.info(`[Goods] -${amount} goods(${goodsId}) from ${source}. Current: ${finalValue}`, { openid });
  return { goodsId, value: finalValue, change: -amount };
}

/**
 * 批量发放物品（用于奖励结算）
 * @param {string} openid
 * @param {Array<{ goodsId: number, change: number, source: string }>} updates
 * @param {Object} [extraSets] - 额外的 set 字段
 * @returns {Promise<Object>} updated goods map
 */
async function batchAddGoods(openid, updates, extraSets = {}) {
  const increments = {};

  for (const { goodsId, change, source } of updates) {
    validateGoodsId(goodsId);
    if (change <= 0) continue;

    increments[goodsId] = (increments[goodsId] || 0) + change;
    logger.info(`[Goods] Batch: +${change} goods(${goodsId}) from ${source}`, { openid });
  }

  if (Object.keys(increments).length === 0 && Object.keys(extraSets).length === 0) {
    const userData = await cloudbaseDB.findUserByOpenID(openid);
    return userData?.goods || {};
  }

  const updatedUser = await cloudbaseDB.batchUpdateAndIncrement(openid, extraSets, {}, increments);
  return updatedUser.goods || {};
}

// ==================== 内部工具方法 ====================

function validateGoodsId(goodsId) {
  const tbGoods = configManager.tables.tbgoods;
  if (!tbGoods || !tbGoods.get(goodsId)) {
    throw new Error(`Invalid goods id: ${goodsId}`);
  }
}

function getGoodsName(goodsId) {
  const tbGoods = configManager.tables.tbgoods;
  const goods = tbGoods?.get(goodsId);
  return goods?.name || `goods(${goodsId})`;
}

module.exports = {
  getGoods,
  getGoodsItem,
  addGoods,
  consumeGoods,
  batchAddGoods,
};
