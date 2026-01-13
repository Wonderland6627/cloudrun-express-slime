// CloudBase 文档型数据库工具类
const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase 应用
// 云托管环境下，优先使用环境变量配置
const envId = process.env.TCB_ENV || process.env.ENV_ID; // 云开发环境ID

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

const initConfig = {
  env: envId, // 如果为undefined，SDK会使用默认环境
};

// 如果提供了密钥，则使用密钥认证
if (process.env.TCB_SECRET_ID && process.env.TCB_SECRET_KEY) {
  initConfig.secretId = process.env.TCB_SECRET_ID;
  initConfig.secretKey = process.env.TCB_SECRET_KEY;
  console.log('[CloudBase DB] Using Secret ID/Key authentication');
} else {
  console.log('[CloudBase DB] Using Service Role authentication (CloudRun default)');
}
// 云托管环境下，如果配置了服务角色，可以不传 secretId 和 secretKey

const app = cloudbase.init(initConfig);

// 获取数据库实例
const db = app.database();

// 集合名称常量
const COLLECTIONS = {
  USER_GAME_INFOS: 'UserGameInfos',
  LEVELS: 'Levels'
};

/**
 * 获取用户游戏信息
 * @param {string} openID - 用户openID
 * @returns {Promise<Object>} 用户游戏信息
 */
async function getUserGameInfo(openID) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const result = await collection.where({
      openID: openID
    }).get();

    if (result.data && result.data.length > 0) {
      return result.data[0];
    }

    // 如果没有数据，创建空记录
    const now = new Date();
    const emptyData = {
      openID: openID,
      createdAt: now,
      updatedAt: now,
    };

    const addResult = await collection.add(emptyData);
    if (addResult.id) {
      return {
        ...emptyData,
        _id: addResult.id
      };
    }

    return emptyData;
  } catch (error) {
    console.error('getUserGameInfo error:', error);
    throw error;
  }
}

/**
 * 设置用户游戏信息
 * @param {string} openID - 用户openID
 * @param {Object} gameInfo - 游戏信息对象
 * @returns {Promise<Object>} 更新结果
 */
async function setUserGameInfo(openID, gameInfo) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const now = new Date();

    // 构建更新数据
    const updateData = {
      updatedAt: now,
    };

    // 只更新传入的字段
    if (gameInfo.progressLevelID !== undefined) {
      updateData.progressLevelID = gameInfo.progressLevelID;
    }
    if (gameInfo.nickName !== undefined) {
      updateData.nickName = gameInfo.nickName;
    }
    if (gameInfo.avatarUrl !== undefined) {
      updateData.avatarUrl = gameInfo.avatarUrl;
    }
    if (gameInfo.openID !== undefined) {
      updateData.openID = gameInfo.openID;
    }

    // 检查记录是否存在
    const existResult = await collection.where({
      openID: openID
    }).get();

    if (!existResult.data || existResult.data.length === 0) {
      // 创建新记录
      const addData = {
        openID: openID,
        createdAt: now,
        updatedAt: now,
        ...updateData
      };
      const addResult = await collection.add(addData);
      return {
        _id: addResult.id,
        ...addData
      };
    }

    // 更新现有记录
    const updateResult = await collection.where({
      openID: openID
    }).update(updateData);

    // 返回更新后的数据
    const updatedResult = await collection.where({
      openID: openID
    }).get();

    return updatedResult.data && updatedResult.data.length > 0 
      ? updatedResult.data[0] 
      : { code: 0, msg: 'update success' };
  } catch (error) {
    console.error('setUserGameInfo error:', error);
    throw error;
  }
}

/**
 * 获取用户排行榜
 * @param {number} limit - 返回数量限制，默认100
 * @param {string} currentOpenID - 当前用户openID（可选）
 * @returns {Promise<Array>} 排行榜列表
 */
async function getUserRankList(limit = 100, currentOpenID = null) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const _ = db.command;

    // 获取前100名玩家数据，按 progressLevelID 降序排序
    // 筛选条件：progressLevelID 必须大于 0，nickName 必须存在且不为空字符串
    const result = await collection
      .where({
        progressLevelID: _.gt(0),
        nickName: _.and(_.exists(true), _.neq(''))
      })
      .orderBy('progressLevelID', 'desc')
      .limit(limit)
      .get();

    let rankList = result.data || [];

    // 如果提供了当前用户openID，检查自己是否在列表中
    if (currentOpenID) {
      const selfInList = rankList.some(item => item.openID === currentOpenID);
      
      if (!selfInList) {
        // 如果自己不在前100名，查询自己的数据
        const selfResult = await collection
          .where({
            openID: currentOpenID
          })
          .get();

        if (selfResult.data && selfResult.data.length > 0) {
          const selfData = selfResult.data[0];
          const selfProgressLevelID = selfData.progressLevelID || 0;

          // 判断自己是否满足前100的条件
          if (selfProgressLevelID > 0) {
            if (rankList.length < limit) {
              // 少于100条，直接加入
              rankList.push(selfData);
            } else if (rankList.length > 0) {
              // 已有100条，检查自己的 progressLevelID 是否 >= 第100名的 progressLevelID
              const lastRankProgressLevelID = rankList[rankList.length - 1].progressLevelID || 0;
              if (selfProgressLevelID >= lastRankProgressLevelID) {
                rankList[rankList.length - 1] = selfData;
              }
            }
          }
        }
      }
    }

    return rankList;
  } catch (error) {
    console.error('getUserRankList error:', error);
    throw error;
  }
}

/**
 * 获取关卡配置
 * @param {string} levelId - 关卡ID
 * @returns {Promise<Object|null>} 关卡配置数据
 */
async function getLevelsConfig(levelId) {
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
    console.error('getLevelsConfig error:', error);
    throw error;
  }
}

module.exports = {
  getUserGameInfo,
  setUserGameInfo,
  getUserRankList,
  getLevelsConfig
};

