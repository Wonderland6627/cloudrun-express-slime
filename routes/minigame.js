// 小游戏API路由 - V2版本（使用 CloudBase 文档型数据库）
const express = require('express');
const router = express.Router();
const { code2Session, getOpenIdFromRequest } = require('../utils/wechatAuth');
const cloudbaseDB = require('../utils/cloudbaseDB');

/**
 * POST /api/minigame/getCode2Session
 * 通过code获取微信用户信息
 * 参数: code (query或body)
 */
router.post('/getCode2Session', async (req, res) => {
  try {
    const code = req.body.code || req.query.code;
    
    if (!code) {
      return res.json({
        code: -1,
        msg: 'code parameter is required'
      });
    }

    const sessionInfo = await code2Session(code);
    
    res.json({
      code: 0,
      data: {
        openid: sessionInfo.openid,
        appid: process.env.WX_APPID,
        unionid: sessionInfo.unionid,
        session_key: sessionInfo.session_key
      },
      msg: 'success'
    });
  } catch (error) {
    console.error('getCode2Session error:', error);
    res.json({
      code: -1,
      msg: error.message
    });
  }
});

/**
 * POST /api/minigame/getUserWXContext
 * 获取微信上下文（需要从header或body中传递openid）
 */
router.post('/getUserWXContext', async (req, res) => {
  try {
    const openid = getOpenIdFromRequest(req);
    
    if (!openid) {
      return res.json({
        code: -1,
        msg: 'openid is required (pass in header x-openid or body.openid)'
      });
    }

    res.json({
      code: 0,
      data: {
        event: req.body,
        openid: openid,
        appid: process.env.WX_APPID,
        unionid: null // 需要从数据库获取或通过code2Session获取
      },
      msg: 'get user wx context success'
    });
  } catch (error) {
    console.error('getUserWXContext error:', error);
    res.json({
      code: -1,
      msg: error.message
    });
  }
});

/**
 * POST /api/minigame/getUserGameInfoV2
 * 获取用户游戏信息（V2版本）
 */
router.post('/getUserGameInfoV2', async (req, res) => {
  try {
    const openid = getOpenIdFromRequest(req);
    
    if (!openid) {
      return res.json({
        code: -1,
        msg: 'openid is required'
      });
    }

    const userData = await cloudbaseDB.getUserGameInfo(openid);
    
    // 检查是否是刚创建的空记录
    const isNewRecord = userData.createdAt && userData.updatedAt && 
                       userData.createdAt.getTime() === userData.updatedAt.getTime();
    
    res.json({
      code: 0,
      data: userData,
      msg: isNewRecord 
        ? 'no result found, created empty info' 
        : 'get user game info success'
    });
  } catch (error) {
    console.error('getUserGameInfoV2 error:', error);
    res.json({
      code: -1,
      msg: error.message
    });
  }
});

/**
 * POST /api/minigame/setUserGameInfoV2
 * 设置用户游戏信息（V2版本）
 */
router.post('/setUserGameInfoV2', async (req, res) => {
  try {
    const openid = getOpenIdFromRequest(req);
    
    if (!openid) {
      return res.json({
        code: -1,
        msg: 'openid is required'
      });
    }

    // 从body中获取游戏信息（排除openid相关字段）
    const { openid: _, openID: __, ...gameInfo } = req.body;
    
    const result = await cloudbaseDB.setUserGameInfo(openid, gameInfo);
    
    res.json({
      code: 0,
      data: result,
      msg: 'update user game info success'
    });
  } catch (error) {
    console.error('setUserGameInfoV2 error:', error);
    res.json({
      code: -1,
      msg: error.message
    });
  }
});

/**
 * POST /api/minigame/getUserRankListV2
 * 获取排行榜（V2版本）
 */
router.post('/getUserRankListV2', async (req, res) => {
  try {
    const currentOpenID = getOpenIdFromRequest(req);
    const limit = parseInt(req.body.limit || req.query.limit || 100);
    
    const rankList = await cloudbaseDB.getUserRankList(limit, currentOpenID);
    
    res.json({
      code: 0,
      data: rankList,
      msg: 'get rank list v2 success'
    });
  } catch (error) {
    console.error('getUserRankListV2 error:', error);
    res.json({
      code: -1,
      data: [],
      msg: error.message
    });
  }
});

/**
 * POST /api/minigame/getLevelsConfigV2
 * 获取关卡配置（V2版本）
 */
router.post('/getLevelsConfigV2', async (req, res) => {
  try {
    const levelId = req.body.levelId || req.query.levelId || 'c0a2d8e468439784021a265910ba40eb';
    const levelData = await cloudbaseDB.getLevelsConfig(levelId);
    
    if (!levelData) {
      return res.json({
        code: -1,
        msg: 'level not found'
      });
    }
    
    res.json({
      code: 0,
      data: levelData,
      msg: 'get levels config success'
    });
  } catch (error) {
    console.error('getLevelsConfigV2 error:', error);
    res.json({
      code: -1,
      msg: error.message
    });
  }
});

module.exports = router;
