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
  
  // 业务逻辑：如果不存在，创建空记录
  if (!userData) {
    const now = new Date();
    userData = await cloudbaseDB.createUser({
      openID: openid,
      createdAt: now,
      updatedAt: now
    });
  }
  
  // 检查是否是刚创建的空记录
  // 处理日期字段：数据库可能返回字符串格式，需要转换为Date对象
  const createdAt = userData.createdAt instanceof Date 
    ? userData.createdAt 
    : new Date(userData.createdAt);
  const updatedAt = userData.updatedAt instanceof Date 
    ? userData.updatedAt 
    : new Date(userData.updatedAt);
  
  const isNewRecord = userData.createdAt && userData.updatedAt && 
                     createdAt.getTime() === updatedAt.getTime();
  
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
