// 应用常量配置
const configManager = require('./luban/configManager');

const RESOURCE_TYPE = {
  COIN: 1,
  ENERGY: 2,
  DIAMOND: 3
};

const RESOURCE_KEY_MAP = { [RESOURCE_TYPE.COIN]: 'coin', [RESOURCE_TYPE.ENERGY]: 'energy', [RESOURCE_TYPE.DIAMOND]: 'diamond' };

function buildResourceConfig() {
  const gc = configManager.tables.tbglobalconfig?.getData();
  const tbRes = configManager.tables.tbresource;
  if (!tbRes || !gc) {
    console.warn('[constants] Luban config not loaded, using fallback RESOURCE_CONFIG');
    return {
      1: { key: 'coin', defaultValue: 0, min: 0, max: null },
      2: { key: 'energy', defaultValue: 150, min: 0, max: 150 },
      3: { key: 'diamond', defaultValue: 0, min: 0, max: null }
    };
  }

  const config = {};
  for (const res of tbRes.getAll()) {
    const isEnergy = res.id === RESOURCE_TYPE.ENERGY;
    config[res.id] = {
      key: RESOURCE_KEY_MAP[res.id] || res.name,
      defaultValue: res.default_value,
      min: 0,
      max: isEnergy ? gc.energy_max : null
    };
  }
  return config;
}

module.exports = {
  COLLECTIONS: {
    USER_GAME_INFOS: 'UserGameInfos',
    LEVELS: 'Levels'
  },
  
  DEFAULTS: {
    RANK_LIMIT: 100,
    DEFAULT_LEVEL_ID: 'c0a2d8e468439784021a265910ba40eb'
  },
  
  RESPONSE_CODE: {
    SUCCESS: 0,
    ERROR: -1,
    UNAUTHORIZED: -2,
    NOT_FOUND: -3,
    VALIDATION_ERROR: -4
  },
  
  // 资源类型枚举（与客户端 ResourceType enum 一致）
  RESOURCE_TYPE,

  // 资源配置（从 Luban TbResource + TbGlobalConfig 构建）
  RESOURCE_CONFIG: buildResourceConfig(),

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
