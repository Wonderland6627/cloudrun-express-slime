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

// ==================== 关卡相关DAO方法 ====================

/**
 * 根据ID查询关卡配置
 * @param {string} levelId - 关卡ID
 * @returns {Promise<Object|null>} 关卡配置，不存在返回null
 */
async function findLevelById(levelId) {
  try {
    const collection = db.collection(COLLECTIONS.LEVELS);
    
    // 方式一：使用 doc() 方法根据 _id 查询（推荐）
    try {
      const doc = collection.doc(levelId);
      const result = await doc.get();
      
      if (result.data) {
        return result.data;
      }
    } catch (docError) {
      // 如果 doc() 方法失败，尝试使用 where 查询
      console.warn('doc() query failed, trying where query:', docError.message);
    }
    
    // 方式二：使用 where 方法查询（备用）
    const result = await collection.where({
      _id: levelId
    }).get();
    
    if (result.data && result.data.length > 0) {
      return result.data[0];
    }
    
    return null;
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
  
  // 导出command对象供Service层使用
  command
};
