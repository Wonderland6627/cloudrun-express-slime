// 统一资源服务层 —— 替代原 currencyService + energyService
const cloudbaseDB = require('../utils/cloudbaseDB');
const { logger } = require('../utils/logger');
const { RESOURCE_TYPE, RESOURCE_CONFIG, RESPONSE_CODE } = require('../config/constants');
const { AppError } = require('../middlewares/errorHandler');

/**
 * 获取用户所有资源
 * @param {string} openid
 * @returns {Promise<Object>} resources map e.g. { 1: 500, 2: 80, 3: 0 }
 */
async function getResources(openid) {
  const userData = await cloudbaseDB.findUserByOpenID(openid);
  if (!userData) throw new Error('User not found');

  return userData.resources || getDefaultResources();
}

/**
 * 获取单项资源值
 * @param {string} openid
 * @param {number} resourceType
 * @returns {Promise<number>}
 */
async function getResource(openid, resourceType) {
  validateResourceType(resourceType);
  const resources = await getResources(openid);
  const config = RESOURCE_CONFIG[resourceType];
  return resources[resourceType] ?? config.defaultValue;
}

/**
 * 通用资源增减
 * @param {string} openid
 * @param {number} resourceType - ResourceType ID
 * @param {number} change - positive to add, negative to deduct
 * @param {string} source - change source
 * @returns {Promise<{ resourceType: number, value: number, change: number }>}
 */
async function updateResource(openid, resourceType, change, source) {
  validateResourceType(resourceType);
  if (change === 0) throw new Error('Change amount cannot be 0');

  const config = RESOURCE_CONFIG[resourceType];
  const userData = await cloudbaseDB.findUserByOpenID(openid);
  if (!userData) throw new Error('User not found');

  const currentResources = userData.resources || getDefaultResources();
  const currentValue = currentResources[resourceType] ?? config.defaultValue;
  let newValue = currentValue + change;

  if (config.min !== null && newValue < config.min) {
    throw new AppError(
      `Insufficient ${config.key}. Current: ${currentValue}, Required: ${Math.abs(change)}`,
      RESPONSE_CODE.RESOURCE_NOT_ENOUGH, 400
    );
  }
  if (config.max !== null && newValue > config.max) {
    change = config.max - currentValue;
    newValue = config.max;
    if (change <= 0) {
      logger.info(`[Resource] ${config.key} already at max(${config.max}), skip`, { openid });
      return { resourceType, value: currentValue, change: 0 };
    }
  }

  const updatedUser = await cloudbaseDB.setResource(openid, resourceType, newValue);
  const finalValue = (updatedUser.resources && updatedUser.resources[resourceType]) ?? newValue;

  logger.info(`[Resource] ${change > 0 ? 'added' : 'deducted'} ${Math.abs(change)} ${config.key} from ${source}. Current: ${finalValue}`, { openid });

  return { resourceType, value: finalValue, change };
}

/**
 * 批量更新资源（用于通关奖励等需要同时修改多种资源的场景）
 * @param {string} openid
 * @param {Array<{ resourceType: number, change: number, source: string }>} updates
 * @param {Object} [extraSets] - 额外的 set 字段（如 progressLevelID）
 * @returns {Promise<Object>} updated resources map
 */
async function batchUpdateResources(openid, updates, extraSets = {}) {
  const userData = await cloudbaseDB.findUserByOpenID(openid);
  if (!userData) throw new Error('User not found');

  const currentResources = userData.resources || getDefaultResources();
  const increments = {};

  for (const { resourceType, change, source } of updates) {
    validateResourceType(resourceType);
    if (change === 0) continue;

    const config = RESOURCE_CONFIG[resourceType];
    const currentValue = currentResources[resourceType] ?? config.defaultValue;
    let actualChange = change;
    const newValue = currentValue + actualChange;

    if (config.min !== null && newValue < config.min) {
      throw new AppError(
        `Insufficient ${config.key}. Current: ${currentValue}, Required: ${Math.abs(actualChange)}`,
        RESPONSE_CODE.RESOURCE_NOT_ENOUGH, 400
      );
    }
    if (config.max !== null && newValue > config.max) {
      actualChange = config.max - currentValue;
      if (actualChange <= 0) {
        logger.info(`[Resource] Batch: ${config.key} already at max(${config.max}), skip`, { openid });
        continue;
      }
    }

    increments[resourceType] = (increments[resourceType] || 0) + actualChange;
    logger.info(`[Resource] Batch: ${actualChange > 0 ? '+' : ''}${actualChange} ${config.key} from ${source}`, { openid });
  }

  if (Object.keys(increments).length === 0 && Object.keys(extraSets).length === 0) {
    return currentResources;
  }

  const updatedUser = await cloudbaseDB.batchUpdateAndIncrement(openid, extraSets, increments);
  return updatedUser.resources || currentResources;
}

// ==================== 内部工具方法 ====================

function validateResourceType(resourceType) {
  if (!RESOURCE_CONFIG[resourceType]) {
    throw new Error(`Invalid resource type: ${resourceType}`);
  }
}

function getDefaultResources() {
  const defaults = {};
  for (const [typeId, config] of Object.entries(RESOURCE_CONFIG)) {
    defaults[typeId] = config.defaultValue;
  }
  return defaults;
}

module.exports = {
  getResources,
  getResource,
  updateResource,
  batchUpdateResources,
  getDefaultResources,
  RESOURCE_TYPE
};
