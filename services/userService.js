// 用户服务层（业务逻辑）
const cloudbaseDB = require('../utils/cloudbaseDB');
const { getDefaultResources } = require('./resourceService');

/**
 * 获取用户游戏信息
 * @param {string} openid
 * @returns {Promise<Object>}
 */
async function getUserGameInfo(openid) {
  let userData = await cloudbaseDB.findUserByOpenID(openid);
  let isNewRecord = false;
  
  if (!userData) {
    const now = new Date();
    userData = await cloudbaseDB.createUser({
      openID: openid,
      resources: getDefaultResources(),
      createdAt: now,
      updatedAt: now
    });
    isNewRecord = true;
  }
  
  return {
    data: userData,
    isNewRecord
  };
}

/**
 * 设置用户游戏信息
 * @param {string} openid
 * @param {Object} gameInfo
 * @returns {Promise<Object>}
 */
async function setUserGameInfo(openid, gameInfo) {
  const { openid: _, openID: __, ...cleanGameInfo } = gameInfo;
  
  const existingUser = await cloudbaseDB.findUserByOpenID(openid);
  
  if (existingUser) {
    return await cloudbaseDB.updateUser(openid, cleanGameInfo);
  } else {
    const now = new Date();
    return await cloudbaseDB.createUser({
      openID: openid,
      resources: getDefaultResources(),
      createdAt: now,
      updatedAt: now,
      ...cleanGameInfo
    });
  }
}

/**
 * 获取微信上下文信息
 * @param {string} openid
 * @param {Object} eventData
 * @returns {Object}
 */
function getUserWXContext(openid, eventData) {
  return {
    event: eventData,
    openid: openid,
    appid: process.env.WX_APPID,
    unionid: null
  };
}

module.exports = {
  getUserGameInfo,
  setUserGameInfo,
  getUserWXContext
};
