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

// ==================== 货币相关DAO方法（原子操作）====================

async function incrementCurrency(openID, currencyType, amount) {
  try {
    const db = getDB();
    const _ = db.command;
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);

    await collection.where({ openID }).update({
      [currencyType]: _.inc(amount),
      updatedAt: new Date()
    });

    const updatedResult = await collection.where({ openID }).get();
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    throw new Error('User not found after update');
  } catch (error) {
    console.error('incrementCurrency error:', error);
    throw error;
  }
}

async function decrementCurrency(openID, currencyType, amount) {
  try {
    const db = getDB();
    const _ = db.command;
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);

    const userData = await findUserByOpenID(openID);
    if (!userData) throw new Error('User not found');

    if (userData[currencyType] === undefined || userData[currencyType] === null) {
      await collection.where({ openID }).update({
        [currencyType]: 0,
        updatedAt: new Date()
      });
      userData[currencyType] = 0;
    }

    const currentAmount = userData[currencyType] || 0;
    if (currentAmount < amount) {
      throw new Error(`Insufficient ${currencyType}`);
    }

    const updateResult = await collection.where({
      openID,
      [currencyType]: _.gte(amount)
    }).update({
      [currencyType]: _.inc(-amount),
      updatedAt: new Date()
    });

    if (updateResult.updated === 0) {
      throw new Error(`Insufficient ${currencyType}`);
    }

    const updatedResult = await collection.where({ openID }).get();
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    throw new Error('User not found after update');
  } catch (error) {
    console.error('decrementCurrency error:', error);
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
  incrementCurrency,
  decrementCurrency,
  get command() { return getDB().command; },
  warmUp
};
