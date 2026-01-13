// 小游戏API路由 - 重构后的版本（标准分层架构）
const express = require('express');
const router = express.Router();

// 中间件
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/auth');
const { validateCode } = require('../middlewares/validator');

// 控制器
const minigameController = require('../controllers/minigameController');

/**
 * POST /api/minigame/getCode2Session
 * 通过code获取微信用户信息
 * 参数: code (query或body)
 */
router.post('/getCode2Session', 
  validateCode,
  minigameController.getCode2Session
);

/**
 * POST /api/minigame/getUserWXContext
 * 获取微信上下文（需要从header或body中传递openid）
 */
router.post('/getUserWXContext',
  authMiddleware,
  minigameController.getUserWXContext
);

/**
 * POST /api/minigame/getUserGameInfoV2
 * 获取用户游戏信息（V2版本）
 */
router.post('/getUserGameInfoV2',
  authMiddleware,
  minigameController.getUserGameInfo
);

/**
 * POST /api/minigame/setUserGameInfoV2
 * 设置用户游戏信息（V2版本）
 */
router.post('/setUserGameInfoV2',
  authMiddleware,
  minigameController.setUserGameInfo
);

/**
 * POST /api/minigame/getUserRankListV2
 * 获取排行榜（V2版本）
 */
router.post('/getUserRankListV2',
  optionalAuthMiddleware, // openid可选
  minigameController.getUserRankList
);

/**
 * POST /api/minigame/getLevelsConfigV2
 * 获取关卡配置（V2版本）
 * 注意：配置信息可能需要认证，使用可选认证中间件
 */
router.post('/getLevelsConfigV2',
  optionalAuthMiddleware, // 可选认证，用于记录用户访问
  minigameController.getLevelsConfig
);

module.exports = router;
