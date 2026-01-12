// 微信认证工具模块
const axios = require('axios');

/**
 * 通过code获取微信用户openid和session_key
 * @param {string} code - 微信登录凭证code
 * @returns {Promise<Object>} 返回openid, session_key等信息
 */
async function code2Session(code) {
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
      unionid: data.unionid || null
    };
  } catch (error) {
    console.error('Code2Session error:', error.message);
    throw error;
  }
}

/**
 * 从请求中获取openid（从header或body中）
 * @param {Object} req - Express请求对象
 * @returns {string|null} openid
 */
function getOpenIdFromRequest(req) {
  // 优先从header获取
  if (req.headers['x-openid']) {
    return req.headers['x-openid'];
  }
  // 从body获取
  if (req.body && req.body.openid) {
    return req.body.openid;
  }
  // 从query获取
  if (req.query && req.query.openid) {
    return req.query.openid;
  }
  return null;
}

module.exports = {
  code2Session,
  getOpenIdFromRequest
};
