// 认证服务层
const { code2Session } = require('../utils/wechatAuth');

/**
 * 通过code获取微信用户信息
 * @param {string} code - 微信登录凭证code
 * @returns {Promise<Object>} 返回openid, session_key等信息
 */
async function getWeChatSession(code) {
  const sessionInfo = await code2Session(code);
  
  return {
    openid: sessionInfo.openid,
    appid: process.env.WX_APPID,
    unionid: sessionInfo.unionid,
    session_key: sessionInfo.session_key
  };
}

module.exports = {
  getWeChatSession
};

