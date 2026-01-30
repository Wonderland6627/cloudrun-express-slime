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
  },
  
  // 货币类型枚举
  CURRENCY_TYPES: {
    COIN: 'coin',
    DIAMOND: 'diamond'  // 未来扩展
  },
  
  // 货币来源枚举
  CURRENCY_SOURCE: {
    DAILY_CHECKIN: 'daily_checkin',
    LEVEL_REWARD: 'level_reward',
    FIRST_CLEAR: 'first_clear',
    STAR_REWARD: 'star_reward',
    DAILY_TASK: 'daily_task',
    ACHIEVEMENT: 'achievement'
  },
  
  // 体力值常量
  ENERGY: {
    MAX: 150  // 体力值上限
  },
  
  // 体力值来源枚举
  ENERGY_SOURCE: {
    DAILY_LOGIN: 'daily_login',
    AD_REWARD: 'ad_reward',
    CHEST_REWARD: 'chest_reward',
    LEVEL_CONSUME: 'level_consume'
  }
};

