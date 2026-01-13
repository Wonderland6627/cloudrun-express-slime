// 游戏服务层（业务逻辑）
const cloudbaseDB = require('../utils/cloudbaseDB');
const { DEFAULTS } = require('../config/constants');

/**
 * 获取用户排行榜
 * 业务逻辑：查询排行榜，如果当前用户不在列表中且满足条件，则添加到列表
 * @param {number} limit - 返回数量限制
 * @param {string} currentOpenID - 当前用户openID（可选）
 * @returns {Promise<Array>} 排行榜列表
 */
async function getUserRankList(limit, currentOpenID = null) {
  const actualLimit = limit || DEFAULTS.RANK_LIMIT;
  
  // 获取数据库command对象（用于构建查询条件）
  const _ = cloudbaseDB.command;
  
  // 查询排行榜（DAO层只负责数据查询）
  const rankList = await cloudbaseDB.findUsersByCondition(
    {
      progressLevelID: _.gt(0),
      nickName: _.and(_.exists(true), _.neq(''))
    },
    {
      orderBy: 'progressLevelID',
      orderDirection: 'desc',
      limit: actualLimit
    }
  );
  
  // 业务逻辑：如果提供了当前用户openID，检查自己是否在列表中
  if (currentOpenID) {
    const selfInList = rankList.some(item => item.openID === currentOpenID);
    
    if (!selfInList) {
      // 查询当前用户数据
      const selfData = await cloudbaseDB.findUserByOpenID(currentOpenID);
      
      if (selfData && selfData.progressLevelID > 0) {
        // 业务逻辑：如果排行榜未满，直接加入；如果已满，检查是否可以替换最后一名
        if (rankList.length < actualLimit) {
          rankList.push(selfData);
        } else if (rankList.length > 0) {
          const lastRankProgressLevelID = rankList[rankList.length - 1].progressLevelID || 0;
          if (selfData.progressLevelID >= lastRankProgressLevelID) {
            rankList[rankList.length - 1] = selfData;
          }
        }
      }
    }
  }
  
  return rankList;
}

/**
 * 获取关卡配置
 * @param {string} levelId - 关卡ID
 * @returns {Promise<Object|null>} 关卡配置数据
 */
async function getLevelsConfig(levelId) {
  const actualLevelId = levelId || DEFAULTS.DEFAULT_LEVEL_ID;
  return await cloudbaseDB.findLevelById(actualLevelId);
}

module.exports = {
  getUserRankList,
  getLevelsConfig
};
