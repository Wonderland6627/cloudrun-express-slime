// CloudBase 文档型数据库工具类（DAO层 - 纯数据访问）
const cloudbase = require('@cloudbase/node-sdk');
const dbConfig = require('../config/database');
const { COLLECTIONS } = require('../config/constants');

// 初始化 CloudBase 应用
const envId = dbConfig.getEnvId();
const initConfig = dbConfig.getAuthConfig();

// 诊断日志：输出环境变量配置状态
console.log('[CloudBase DB] Initializing database connection...');
console.log('[CloudBase DB] TCB_ENV:', process.env.TCB_ENV || '(not set)');
console.log('[CloudBase DB] ENV_ID:', process.env.ENV_ID || '(not set)');
console.log('[CloudBase DB] Using env:', envId || '(will use default - first created environment)');

if (!envId) {
  console.warn('[CloudBase DB] ⚠️  WARNING: No environment ID specified!');
  console.warn('[CloudBase DB] ⚠️  SDK will use the first created environment by default.');
  console.warn('[CloudBase DB] ⚠️  To fix this, set TCB_ENV or ENV_ID environment variable.');
  console.warn('[CloudBase DB] ⚠️  Example: TCB_ENV=your-env-id');
}

if (initConfig.secretId && initConfig.secretKey) {
  console.log('[CloudBase DB] Using Secret ID/Key authentication');
} else {
  console.log('[CloudBase DB] Using Service Role authentication (CloudRun default)');
}

const app = cloudbase.init(initConfig);

// 获取数据库实例
const db = app.database();

// 导出command对象供Service层使用（用于构建查询条件）
const command = db.command;

// ==================== 用户相关DAO方法 ====================

/**
 * 根据openID查询用户游戏信息
 * @param {string} openID - 用户openID
 * @returns {Promise<Object|null>} 用户游戏信息，不存在返回null
 */
async function findUserByOpenID(openID) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const result = await collection.where({
      openID: openID
    }).get();

    if (result.data && result.data.length > 0) {
      return result.data[0];
    }
    return null;
  } catch (error) {
    console.error('findUserByOpenID error:', error);
    throw error;
  }
}

/**
 * 创建用户游戏信息记录
 * @param {Object} userData - 用户数据对象
 * @returns {Promise<Object>} 创建的用户记录（包含_id）
 */
async function createUser(userData) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const now = new Date();
    
    const dataToInsert = {
      ...userData,
      createdAt: userData.createdAt || now,
      updatedAt: userData.updatedAt || now
    };
    
    const addResult = await collection.add(dataToInsert);
    
    return {
      _id: addResult.id,
      ...dataToInsert
    };
  } catch (error) {
    console.error('createUser error:', error);
    throw error;
  }
}

/**
 * 更新用户游戏信息
 * @param {string} openID - 用户openID
 * @param {Object} updateData - 要更新的数据
 * @returns {Promise<Object>} 更新后的用户记录
 */
async function updateUser(openID, updateData) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const now = new Date();
    
    const dataToUpdate = {
      ...updateData,
      updatedAt: now
    };
    
    await collection.where({
      openID: openID
    }).update(dataToUpdate);
    
    // 返回更新后的数据
    const updatedResult = await collection.where({
      openID: openID
    }).get();
    
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    
    throw new Error('User not found after update');
  } catch (error) {
    console.error('updateUser error:', error);
    throw error;
  }
}

/**
 * 根据条件查询用户列表
 * @param {Object} condition - 查询条件
 * @param {Object} options - 查询选项 { limit, orderBy, orderDirection }
 * @returns {Promise<Array>} 用户列表
 */
async function findUsersByCondition(condition, options = {}) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const _ = db.command;
    
    let query = collection.where(condition);
    
    // 排序
    if (options.orderBy) {
      const direction = options.orderDirection || 'desc';
      query = query.orderBy(options.orderBy, direction);
    }
    
    // 限制数量
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

/**
 * 原子操作：增加货币
 * @param {string} openID - 用户openID
 * @param {string} currencyType - 货币类型（如：'coin', 'diamond'）
 * @param {number} amount - 增加的数量（必须 > 0）
 * @returns {Promise<Object>} 更新后的用户记录
 */
async function incrementCurrency(openID, currencyType, amount) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const _ = db.command;
    
    // 使用原子操作 inc，如果字段不存在会自动初始化为 0 后再增加
    await collection.where({
      openID: openID
    }).update({
      [currencyType]: _.inc(amount),
      updatedAt: new Date()
    });
    
    // 返回更新后的数据
    const updatedResult = await collection.where({
      openID: openID
    }).get();
    
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    
    throw new Error('User not found after update');
  } catch (error) {
    console.error('incrementCurrency error:', error);
    throw error;
  }
}

/**
 * 原子操作：扣除货币（带余额检查）
 * @param {string} openID - 用户openID
 * @param {string} currencyType - 货币类型（如：'coin', 'diamond'）
 * @param {number} amount - 扣除的数量（必须 > 0）
 * @returns {Promise<Object>} 更新后的用户记录
 */
async function decrementCurrency(openID, currencyType, amount) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const _ = db.command;
    
    // 先查询用户，检查余额
    const userData = await findUserByOpenID(openID);
    if (!userData) {
      throw new Error('User not found');
    }
    
    // 如果字段不存在，先初始化为 0（懒加载）
    if (userData[currencyType] === undefined || userData[currencyType] === null) {
      await collection.where({
        openID: openID
      }).update({
        [currencyType]: 0,
        updatedAt: new Date()
      });
      // 更新本地数据
      userData[currencyType] = 0;
    }
    
    // 确保字段存在后，检查余额
    const currentAmount = userData[currencyType] || 0;
    
    // 检查余额是否足够
    if (currentAmount < amount) {
      throw new Error(`Insufficient ${currencyType}`);
    }
    
    // 使用原子操作 dec 扣除（通过 inc 负数实现）
    // 同时使用条件确保余额足够，防止并发问题
    const updateResult = await collection.where({
      openID: openID,
      [currencyType]: _.gte(amount)  // 确保余额足够
    }).update({
      [currencyType]: _.inc(-amount),  // 负数表示扣除
      updatedAt: new Date()
    });
    
    // 检查更新是否成功（如果余额不足，更新会失败）
    if (updateResult.updated === 0) {
      throw new Error(`Insufficient ${currencyType}`);
    }
    
    // 返回更新后的数据
    const updatedResult = await collection.where({
      openID: openID
    }).get();
    
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

/**
 * 根据ID查询关卡配置
 * @param {string} levelId - 关卡ID
 * @returns {Promise<Object|null>} 关卡配置，不存在返回null
 */
async function findLevelById(levelId) {
  try {
    const collection = db.collection(COLLECTIONS.LEVELS);
    const doc = collection.doc(levelId);
    const result = await doc.get();
    
    return result.data || null;
  } catch (error) {
    console.error('findLevelById error:', error);
    throw error;
  }
}

module.exports = {
  // 基础DAO方法
  findUserByOpenID,
  createUser,
  updateUser,
  findUsersByCondition,
  findLevelById,
  
  // 货币原子操作方法
  incrementCurrency,
  decrementCurrency,
  
  // 导出command对象供Service层使用
  command
};
