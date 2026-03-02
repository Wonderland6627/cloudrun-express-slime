// CloudBase 文档型数据库工具类（DAO层）
// 核心优化：延迟初始化 —— @cloudbase/node-sdk 仅在首次数据库操作时加载，不阻塞服务启动
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

  console.log(`[CloudBase DB] Lazy init... env: ${envId || '(default)'}, auth: ${initConfig.secretId ? 'SecretKey' : 'ServiceRole'}`);

  const app = cloudbase.init(initConfig);
  _db = app.database();

  console.log('[CloudBase DB] Initialized successfully');
  return _db;
}

/**
 * 后台预热：服务启动后异步调用，提前初始化 SDK 以加速首次请求
 */
function warmUp() {
  try {
    getDB();
  } catch (e) {
    console.warn('[CloudBase DB] Warm-up failed:', e.message);
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
    console.error('findUserByOpenID error:', error);
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
    console.error('createUser error:', error);
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
    console.error('updateUser error:', error);
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
    console.error('findUsersByCondition error:', error);
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
    console.error('incrementResource error:', error);
    throw error;
  }
}

/**
 * 一次原子操作同时 set 和 inc 多个字段（支持 resources 嵌套字段）
 * @param {string} openID
 * @param {Object} sets - 直接赋值字段 e.g. { progressLevelID: 5 }
 * @param {Object} resourceIncrements - resources 内的增量 e.g. { 1: 175, 2: 3 }
 * @returns {Promise<Object>} updated user document
 */
async function batchUpdateAndIncrement(openID, sets, resourceIncrements) {
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

    await collection.where({ openID }).update(updateData);

    const result = await collection.where({ openID }).get();
    if (result.data && result.data.length > 0) {
      return result.data[0];
    }
    throw new Error('User not found after batch update');
  } catch (error) {
    console.error('batchUpdateAndIncrement error:', error);
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
    console.error('findLevelById error:', error);
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
  batchUpdateAndIncrement,
  get command() { return getDB().command; },
  warmUp
};
