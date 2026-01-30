// 用户服务层（业务逻辑）
const cloudbaseDB = require('../utils/cloudbaseDB');

/**
 * 获取用户游戏信息
 * 业务逻辑：如果用户不存在，创建空记录
 * @param {string} openid - 用户openid
 * @returns {Promise<Object>} 用户游戏信息
 */
async function getUserGameInfo(openid) {
  // 先查询用户是否存在
  let userData = await cloudbaseDB.findUserByOpenID(openid);
  let isNewRecord = false;
  
  // 业务逻辑：如果不存在，创建空记录
  if (!userData) {
    const now = new Date();
    userData = await cloudbaseDB.createUser({
      openID: openid,
      coin: 0,  // 新用户默认金币为 0
      energy: 150,  // 新用户默认体力值为 150
      createdAt: now,
      updatedAt: now
    });
    isNewRecord = true; // 标记为刚创建的新记录
  }
  // 注意：老用户的 coin 字段如果不存在，会在首次货币操作时通过懒加载自动初始化
  // 注意：老用户的 energy 字段如果不存在，会在首次体力操作时通过懒加载自动初始化
  
  return {
    data: userData,
    isNewRecord
  };
}

/**
 * 设置用户游戏信息
 * 业务逻辑：如果用户不存在则创建，存在则更新
 * @param {string} openid - 用户openid
 * @param {Object} gameInfo - 游戏信息对象
 * @returns {Promise<Object>} 更新结果
 */
async function setUserGameInfo(openid, gameInfo) {
  // 从gameInfo中排除openid相关字段
  const { openid: _, openID: __, ...cleanGameInfo } = gameInfo;
  
  // 查询用户是否存在
  const existingUser = await cloudbaseDB.findUserByOpenID(openid);
  
  // 业务逻辑：存在则更新，不存在则创建
  if (existingUser) {
    // 更新现有用户
    return await cloudbaseDB.updateUser(openid, cleanGameInfo);
  } else {
    // 创建新用户
    const now = new Date();
    return await cloudbaseDB.createUser({
      openID: openid,
      createdAt: now,
      updatedAt: now,
      ...cleanGameInfo
    });
  }
}

/**
 * 获取微信上下文信息
 * @param {string} openid - 用户openid
 * @param {Object} eventData - 事件数据
 * @returns {Object} 微信上下文信息
 */
function getUserWXContext(openid, eventData) {
  return {
    event: eventData,
    openid: openid,
    appid: process.env.WX_APPID,
    unionid: null // 需要从数据库获取或通过code2Session获取
  };
}

module.exports = {
  getUserGameInfo,
  setUserGameInfo,
  getUserWXContext
};
