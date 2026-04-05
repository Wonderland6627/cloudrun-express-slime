// CloudBase 文档型数据库工具类（DAO层）
// 核心优化：延迟初始化 —— @cloudbase/node-sdk 仅在首次数据库操作时加载，不阻塞服务启动
const { logger } = require('./logger');
const dbConfig = require('../config/database');
const { COLLECTIONS } = require('../config/constants');

let _db = null;

/**
 * 延迟获取数据库实例，首次调用时才加载 SDK 并初始化连接
 */
function getDB() {
  if (_db) return _db;

  const cloudbase = require('@cloudbase/node-sdk');
  const envId = dbConfig.getEnvId();
  const initConfig = dbConfig.getAuthConfig();

  logger.info(`[CloudBase DB] Lazy init... env: ${envId || '(default)'}, auth: ${initConfig.secretId ? 'SecretKey' : 'ServiceRole'}`);

  const app = cloudbase.init(initConfig);
  _db = app.database();

  logger.info('[CloudBase DB] Initialized successfully');
  return _db;
}

/**
 * 后台预热：服务启动后异步调用，提前初始化 SDK 以加速首次请求
 */
function warmUp() {
  try {
    getDB();
  } catch (e) {
    logger.warn('[CloudBase DB] Warm-up failed:', { error: e.message });
  }
}

// ==================== 用户相关DAO方法 ====================

async function findUserByOpenID(openID) {
  try {
    const db = getDB();
    const result = await db.collection(COLLECTIONS.USER_GAME_INFOS)
      .where({ openID })
      .get();

    return (result.data && result.data.length > 0) ? result.data[0] : null;
  } catch (error) {
    logger.error('findUserByOpenID error', { openID, error: error.message });
    throw error;
  }
}

async function createUser(userData) {
  try {
    const db = getDB();
    const now = new Date();
    const dataToInsert = {
      ...userData,
      createdAt: userData.createdAt || now,
      updatedAt: userData.updatedAt || now
    };

    const addResult = await db.collection(COLLECTIONS.USER_GAME_INFOS).add(dataToInsert);
    return { _id: addResult.id, ...dataToInsert };
  } catch (error) {
    logger.error('createUser error', { openID: userData?.openID, error: error.message });
    throw error;
  }
}

async function updateUser(openID, updateData) {
  try {
    const db = getDB();
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const dataToUpdate = { ...updateData, updatedAt: new Date() };

    await collection.where({ openID }).update(dataToUpdate);

    const updatedResult = await collection.where({ openID }).get();
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    throw new Error('User not found after update');
  } catch (error) {
    logger.error('updateUser error', { openID, error: error.message });
    throw error;
  }
}

async function findUsersByCondition(condition, options = {}) {
  try {
    const db = getDB();
    let query = db.collection(COLLECTIONS.USER_GAME_INFOS).where(condition);

    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const result = await query.get();
    return result.data || [];
  } catch (error) {
    logger.error('findUsersByCondition error', { error: error.message });
    throw error;
  }
}

// ==================== 资源相关DAO方法（原子操作）====================

/**
 * 原子增减资源（操作 resources.{resourceTypeId} 字段）
 * @param {string} openID
 * @param {number} resourceTypeId - 资源类型ID
 * @param {number} amount - 变化量（正数增加，负数减少）
 * @returns {Promise<Object>} updated user document
 */
async function incrementResource(openID, resourceTypeId, amount) {
  try {
    const db = getDB();
    const _ = db.command;
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const fieldPath = `resources.${resourceTypeId}`;

    await collection.where({ openID }).update({
      [fieldPath]: _.inc(amount),
      updatedAt: new Date()
    });

    const updatedResult = await collection.where({ openID }).get();
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    throw new Error('User not found after resource update');
  } catch (error) {
    logger.error('incrementResource error', { openID, resourceTypeId, error: error.message });
    throw error;
  }
}

/**
 * 一次原子操作同时 set 和 inc 多个字段（支持 resources 和 goods 嵌套字段）
 * @param {string} openID
 * @param {Object} sets - 直接赋值字段 e.g. { progressLevelID: 5 }
 * @param {Object} resourceIncrements - resources 内的增量 e.g. { 1: 175, 2: 3 }
 * @param {Object} [goodsIncrements] - goods 内的增量 e.g. { 1001: 2, 1002: 1 }
 * @returns {Promise<Object>} updated user document
 */
async function batchUpdateAndIncrement(openID, sets, resourceIncrements, goodsIncrements = {}) {
  try {
    const db = getDB();
    const _ = db.command;
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);

    const updateData = { ...sets, updatedAt: new Date() };
    for (const [resourceTypeId, amount] of Object.entries(resourceIncrements)) {
      if (amount !== 0) {
        updateData[`resources.${resourceTypeId}`] = _.inc(amount);
      }
    }
    for (const [goodsId, amount] of Object.entries(goodsIncrements)) {
      if (amount !== 0) {
        updateData[`goods.${goodsId}`] = _.inc(amount);
      }
    }

    await collection.where({ openID }).update(updateData);

    const result = await collection.where({ openID }).get();
    if (result.data && result.data.length > 0) {
      return result.data[0];
    }
    throw new Error('User not found after batch update');
  } catch (error) {
    logger.error('batchUpdateAndIncrement error', { openID, error: error.message });
    throw error;
  }
}

/**
 * 直接设置资源值（操作 resources.{resourceTypeId} 字段）
 * 解决 _.inc() 对不存在字段从 0 开始计算导致校验与实际不一致的问题
 * @param {string} openID
 * @param {number} resourceTypeId - 资源类型ID
 * @param {number} value - 目标值（由服务层校验后计算得出）
 * @returns {Promise<Object>} updated user document
 */
async function setResource(openID, resourceTypeId, value) {
  try {
    const db = getDB();
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const fieldPath = `resources.${resourceTypeId}`;

    await collection.where({ openID }).update({
      [fieldPath]: value,
      updatedAt: new Date()
    });

    const updatedResult = await collection.where({ openID }).get();
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    throw new Error('User not found after resource set');
  } catch (error) {
    logger.error('setResource error', { openID, resourceTypeId, error: error.message });
    throw error;
  }
}

// ==================== 物品相关DAO方法（原子操作）====================

/**
 * 原子增减物品（操作 goods.{goodsId} 字段）
 * @param {string} openID
 * @param {number} goodsId - 物品ID
 * @param {number} amount - 变化量（正数增加，负数减少）
 * @returns {Promise<Object>} updated user document
 */
async function incrementGoods(openID, goodsId, amount) {
  try {
    const db = getDB();
    const _ = db.command;
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const fieldPath = `goods.${goodsId}`;

    await collection.where({ openID }).update({
      [fieldPath]: _.inc(amount),
      updatedAt: new Date()
    });

    const updatedResult = await collection.where({ openID }).get();
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    throw new Error('User not found after goods update');
  } catch (error) {
    logger.error('incrementGoods error', { openID, goodsId, error: error.message });
    throw error;
  }
}

// ==================== 关卡相关DAO方法 ====================

async function findLevelById(levelId) {
  try {
    const db = getDB();
    const result = await db.collection(COLLECTIONS.LEVELS).doc(levelId).get();
    return result.data || null;
  } catch (error) {
    logger.error('findLevelById error', { levelId, error: error.message });
    throw error;
  }
}

module.exports = {
  findUserByOpenID,
  createUser,
  updateUser,
  findUsersByCondition,
  findLevelById,
  incrementResource,
  setResource,
  incrementGoods,
  batchUpdateAndIncrement,
  get command() { return getDB().command; },
  warmUp
};
