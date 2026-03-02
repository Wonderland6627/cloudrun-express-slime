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
  
  // 资源类型枚举（与客户端 ResourceType enum 一致）
  RESOURCE_TYPE: {
    COIN: 1,
    ENERGY: 2,
    DIAMOND: 3
  },

  // 资源配置（每种资源的校验规则和默认值）
  RESOURCE_CONFIG: {
    1: { key: 'coin', defaultValue: 0, min: 0, max: null },
    2: { key: 'energy', defaultValue: 150, min: 0, max: 150 },
    3: { key: 'diamond', defaultValue: 0, min: 0, max: null }
  },

  // 资源来源枚举（合并原 CURRENCY_SOURCE + ENERGY_SOURCE）
  RESOURCE_SOURCE: {
    DAILY_CHECKIN: 'daily_checkin',
    LEVEL_REWARD: 'level_reward',
    FIRST_CLEAR: 'first_clear',
    STAR_REWARD: 'star_reward',
    DAILY_TASK: 'daily_task',
    ACHIEVEMENT: 'achievement',
    DAILY_LOGIN: 'daily_login',
    AD_REWARD: 'ad_reward',
    CHEST_REWARD: 'chest_reward',
    LEVEL_CONSUME: 'level_consume'
  }
};
