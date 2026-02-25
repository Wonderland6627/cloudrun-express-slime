// 平台认证抽象层 - 支持微信、抖音、B站等不同平台
const axios = require('axios');

// 平台类型枚举
const PLATFORM_TYPES = {
  WECHAT: 'wechat',
  DOUYIN: 'douyin',
  BILIBILI: 'bilibili',
  EDITOR: 'editor' // Unity编辑器平台（测试模式）
};

/**
 * 微信平台认证
 */
class WeChatAuth {
  constructor() {
    this.platform = PLATFORM_TYPES.WECHAT;
  }
  
  /**
   * 通过code获取session信息
   * @param {string} code - 微信登录凭证code
   * @returns {Promise<Object>} {openid, session_key, unionid}
   */
  async code2Session(code) {
    const appid = process.env.WX_APPID;
    const secret = process.env.WX_SECRET;
    
    if (!appid || !secret) {
      throw new Error('WX_APPID and WX_SECRET environment variables are required');
    }
    
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    
    try {
      const response = await axios.get(url);
      const data = response.data;
      
      if (data.errcode) {
        throw new Error(`WeChat API Error: ${data.errcode} - ${data.errmsg}`);
      }
      
      return {
        openid: data.openid,
        session_key: data.session_key,
        unionid: data.unionid || null,
        platform: this.platform
      };
    } catch (error) {
      console.error('WeChat code2Session error:', error.message);
      throw error;
    }
  }
  
  /**
   * 验证session_key（可选，用于额外验证）
   * @param {string} openid - 用户openid
   * @param {string} session_key - session_key
   * @returns {Promise<boolean>} 验证结果
   */
  async verifySession(openid, session_key) {
    // 微信小游戏通常不需要额外验证session_key
    // 这里可以扩展实现签名验证等
    return true;
  }
}

/**
 * 抖音平台认证（预留接口）
 */
class DouYinAuth {
  constructor() {
    this.platform = PLATFORM_TYPES.DOUYIN;
  }
  
  async code2Session(code) {
    // TODO: 实现抖音登录逻辑
    throw new Error('DouYin authentication not implemented yet');
  }
  
  async verifySession(openid, session_key) {
    // TODO: 实现抖音session验证
    return true;
  }
}

/**
 * B站平台认证（预留接口）
 */
class BilibiliAuth {
  constructor() {
    this.platform = PLATFORM_TYPES.BILIBILI;
  }
  
  async code2Session(code) {
    // TODO: 实现B站登录逻辑
    throw new Error('Bilibili authentication not implemented yet');
  }
  
  async verifySession(openid, session_key) {
    // TODO: 实现B站session验证
    return true;
  }
}

/**
 * Unity编辑器平台认证（测试模式）
 * 当ENABLE_TEST_MODE=true时，允许使用任意code获取token
 */
class EditorAuth {
  constructor() {
    this.platform = PLATFORM_TYPES.EDITOR;
  }
  
  async code2Session(code) {
    // 测试模式：使用固定的测试openid
    // code可以是任意值，不做验证
    const testOpenid = process.env.TEST_OPENID || `test_openid_${code}`;
    return {
      openid: testOpenid,
      session_key: 'editor_test_session_key',
      unionid: null,
      platform: this.platform
    };
  }
  
  async verifySession(openid, session_key) {
    // 测试模式总是返回true
    return true;
  }
}

/**
 * 平台认证工厂
 */
class PlatformAuthFactory {
  /**
   * 根据平台类型获取认证实例
   * @param {string} platform - 平台类型
   * @returns {Object} 认证实例
   */
  static getAuthInstance(platform) {
    switch (platform) {
      case PLATFORM_TYPES.WECHAT:
        return new WeChatAuth();
      case PLATFORM_TYPES.DOUYIN:
        return new DouYinAuth();
      case PLATFORM_TYPES.BILIBILI:
        return new BilibiliAuth();
      case PLATFORM_TYPES.EDITOR:
        return new EditorAuth();
      default:
        // 默认使用微信
        return new WeChatAuth();
    }
  }
  
  /**
   * 从请求中检测平台类型
   * @param {Object} req - Express请求对象
   * @returns {string} 平台类型
   * @throws {Error} 当Editor平台在测试模式未启用时
   */
  static detectPlatform(req) {
    let platform = null;
    
    // 从header获取
    if (req.headers['x-platform']) {
      platform = req.headers['x-platform'].toLowerCase();
    }
    // 从body获取
    else if (req.body && req.body.platform) {
      platform = req.body.platform.toLowerCase();
    }
    // 从query获取
    else if (req.query && req.query.platform) {
      platform = req.query.platform.toLowerCase();
    }
    
    // 检查Editor平台是否允许（需要测试模式开关）
    if (platform === PLATFORM_TYPES.EDITOR) {
      if (process.env.ENABLE_TEST_MODE !== 'true') {
        throw new Error('Editor platform is only available in test mode');
      }
      return PLATFORM_TYPES.EDITOR;
    }
    
    // 如果找到了平台类型，直接返回
    if (platform) {
      return platform;
    }
    
    // 默认返回微信平台
    return PLATFORM_TYPES.WECHAT;
  }
}

module.exports = {
  PlatformAuthFactory,
  PLATFORM_TYPES,
  WeChatAuth,
  DouYinAuth,
  BilibiliAuth,
  EditorAuth
};

