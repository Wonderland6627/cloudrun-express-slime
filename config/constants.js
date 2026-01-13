// 应用常量配置
module.exports = {
  // 数据库集合名称
  COLLECTIONS: {
    USER_GAME_INFOS: 'UserGameInfos',
    LEVELS: 'Levels'
  },
  
  // 默认值
  DEFAULTS: {
    RANK_LIMIT: 100,
    DEFAULT_LEVEL_ID: 'c0a2d8e468439784021a265910ba40eb'
  },
  
  // 响应码
  RESPONSE_CODE: {
    SUCCESS: 0,
    ERROR: -1,
    UNAUTHORIZED: -2,
    NOT_FOUND: -3,
    VALIDATION_ERROR: -4
  }
};

