// 认证服务层 - 支持多平台认证
const { PlatformAuthFactory } = require('../utils/platformAuth');
const { generateToken } = require('../utils/tokenManager');

/**
 * 通过code获取用户session信息并生成token
 * @param {string} code - 平台登录凭证code
 * @param {string} platform - 平台类型 (wechat/douyin/bilibili/test)
 * @returns {Promise<Object>} 返回openid, session_key, token等信息
 */
async function getSession(code, platform = 'wechat') {
  const authInstance = PlatformAuthFactory.getAuthInstance(platform);
  const sessionInfo = await authInstance.code2Session(code);
  
  // 生成token
  const token = generateToken({
    openid: sessionInfo.openid,
    platform: sessionInfo.platform,
    session_key: sessionInfo.session_key
  });
  
  return {
    openid: sessionInfo.openid,
    platform: sessionInfo.platform,
    unionid: sessionInfo.unionid,
    session_key: sessionInfo.session_key,
    token: token, // 返回token给客户端
    appid: platform === 'wechat' ? process.env.WX_APPID : null
  };
}

/**
 * 通过code获取微信用户信息（向后兼容）
 * @param {string} code - 微信登录凭证code
 * @returns {Promise<Object>} 返回openid, session_key, token等信息
 */
async function getWeChatSession(code) {
  return await getSession(code, 'wechat');
}

module.exports = {
  getSession,
  getWeChatSession
};

