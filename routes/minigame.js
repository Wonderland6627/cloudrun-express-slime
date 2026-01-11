// 小游戏API路由
const express = require('express');
const router = express.Router();
const { code2Session, getOpenIdFromRequest } = require('../utils/wechatAuth');
const mockDB = require('../utils/mockDatabase');

/**
 * GET /api/minigame/getCode2Session
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
        appid: process.env.WX_APPID || 'wxf55f604f65c8f87b',
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
 * GET /api/minigame/getUserWXContext
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
        openid: openid,
        appid: process.env.WX_APPID || 'wxf55f604f65c8f87b',
        unionid: null // 需要从数据库获取
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
 * GET /api/minigame/getUserGameInfo
 * 获取用户游戏信息
 */
router.post('/getUserGameInfo', async (req, res) => {
  try {
    const openid = getOpenIdFromRequest(req);
    
    if (!openid) {
      return res.json({
        code: -1,
        msg: 'openid is required'
      });
    }

    const userData = await mockDB.getUserGameInfo(openid);
    
    res.json({
      code: 0,
      data: userData,
      msg: userData.createdAt.getTime() === userData.updatedAt.getTime() 
        ? 'no result found, created empty info' 
        : 'get user game info success'
    });
  } catch (error) {
    console.error('getUserGameInfo error:', error);
    res.json({
      code: -1,
      msg: error.message
    });
  }
});

/**
 * POST /api/minigame/setUserGameInfo
 * 设置用户游戏信息
 */
router.post('/setUserGameInfo', async (req, res) => {
  try {
    const openid = getOpenIdFromRequest(req);
    
    if (!openid) {
      return res.json({
        code: -1,
        msg: 'openid is required'
      });
    }

    // 从body中获取游戏信息（排除openid）
    const { openid: _, ...gameInfo } = req.body;
    
    const result = await mockDB.setUserGameInfo(openid, gameInfo);
    
    res.json({
      code: 0,
      data: result,
      msg: 'update user game info success'
    });
  } catch (error) {
    console.error('setUserGameInfo error:', error);
    res.json({
      code: -1,
      msg: error.message
    });
  }
});

/**
 * GET /api/minigame/getUserRankList
 * 获取排行榜
 */
router.post('/getUserRankList', async (req, res) => {
  try {
    const limit = parseInt(req.body.limit || req.query.limit || 100);
    const rankList = await mockDB.getUserRankList(limit);
    
    res.json({
      code: 0,
      data: rankList,
      msg: 'get rank list success'
    });
  } catch (error) {
    console.error('getUserRankList error:', error);
    res.json({
      code: -1,
      data: [],
      msg: error.message
    });
  }
});

/**
 * GET /api/minigame/getLevelsConfig
 * 获取关卡配置
 */
router.post('/getLevelsConfig', async (req, res) => {
  try {
    const levelId = req.body.levelId || req.query.levelId || 'c0a2d8e468439784021a265910ba40eb';
    const levelData = await mockDB.getLevelsConfig(levelId);
    
    if (!levelData) {
      return res.json({
        code: -1,
        msg: 'level not found'
      });
    }
    
    res.json({
      code: 0,
      data: levelData
    });
  } catch (error) {
    console.error('getLevelsConfig error:', error);
    res.json({
      code: -1,
      msg: error.message
    });
  }
});

// V2版本接口（字段结构略有不同）
router.post('/getUserGameInfoV2', async (req, res) => {
  try {
    const openid = getOpenIdFromRequest(req);
    
    if (!openid) {
      return res.json({
        code: -1,
        msg: 'openid is required'
      });
    }

    const userData = await mockDB.getUserGameInfo(openid);
    
    res.json({
      code: 0,
      data: userData,
      msg: userData.createdAt.getTime() === userData.updatedAt.getTime() 
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

router.post('/setUserGameInfoV2', async (req, res) => {
  try {
    const openid = getOpenIdFromRequest(req);
    
    if (!openid) {
      return res.json({
        code: -1,
        msg: 'openid is required'
      });
    }

    const { openid: _, openID: __, ...gameInfo } = req.body;
    const result = await mockDB.setUserGameInfo(openid, gameInfo);
    
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

router.post('/getUserRankListV2', async (req, res) => {
  try {
    const currentOpenID = getOpenIdFromRequest(req);
    const limit = parseInt(req.body.limit || req.query.limit || 100);
    
    let rankList = await mockDB.getUserRankList(limit);
    
    // V2版本逻辑：如果自己不在前100名，尝试添加自己
    if (currentOpenID) {
      const selfInList = rankList.some(item => 
        (item.openID || item.openid) === currentOpenID
      );
      
      if (!selfInList) {
        const selfData = await mockDB.getUserGameInfo(currentOpenID);
        const selfProgressLevelID = selfData.progressLevelID || 0;
        
        if (selfProgressLevelID > 0) {
          if (rankList.length < limit) {
            rankList.push(selfData);
          } else if (rankList.length > 0) {
            const lastRankProgressLevelID = rankList[rankList.length - 1].progressLevelID || 0;
            if (selfProgressLevelID >= lastRankProgressLevelID) {
              rankList[rankList.length - 1] = selfData;
            }
          }
        }
      }
    }
    
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

router.post('/getLevelsConfigV2', async (req, res) => {
  try {
    const levelId = req.body.levelId || req.query.levelId || 'c0a2d8e468439784021a265910ba40eb';
    const levelData = await mockDB.getLevelsConfig(levelId);
    
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
