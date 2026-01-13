// 小游戏控制器
const userService = require('../services/userService');
const gameService = require('../services/gameService');
const authService = require('../services/authService');
const { success } = require('../middlewares/response');
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

/**
 * 通过code获取用户session信息（支持多平台）
 */
async function getCode2Session(req, res, next) {
  try {
    const code = req.body.code || req.query.code;
    // 检测平台类型
    const { PlatformAuthFactory } = require('../utils/platformAuth');
    const platform = PlatformAuthFactory.detectPlatform(req);
    
    // 使用新的getSession方法（支持多平台）
    const sessionInfo = await authService.getSession(code, platform);
    return success(res, sessionInfo);
  } catch (err) {
    next(err);
  }
}

/**
 * 获取微信上下文
 */
async function getUserWXContext(req, res, next) {
  try {
    const openid = req.user.openid;
    const context = userService.getUserWXContext(openid, req.body);
    return success(res, context, 'get user wx context success');
  } catch (err) {
    next(err);
  }
}

/**
 * 获取用户游戏信息
 */
async function getUserGameInfo(req, res, next) {
  try {
    const openid = req.user.openid;
    const { data, isNewRecord } = await userService.getUserGameInfo(openid);
    
    const msg = isNewRecord 
      ? 'no result found, created empty info' 
      : 'get user game info success';
    
    return success(res, data, msg);
  } catch (err) {
    next(err);
  }
}

/**
 * 设置用户游戏信息
 */
async function setUserGameInfo(req, res, next) {
  try {
    const openid = req.user.openid;
    const result = await userService.setUserGameInfo(openid, req.body);
    return success(res, result, 'update user game info success');
  } catch (err) {
    next(err);
  }
}

/**
 * 获取用户排行榜
 */
async function getUserRankList(req, res, next) {
  try {
    const currentOpenID = req.user?.openid || null;
    const limit = parseInt(req.body.limit || req.query.limit || 100);
    
    const rankList = await gameService.getUserRankList(limit, currentOpenID);
    return success(res, rankList, 'get rank list v2 success');
  } catch (err) {
    next(err);
  }
}

/**
 * 获取关卡配置
 */
async function getLevelsConfig(req, res, next) {
  try {
    const levelId = req.body.levelId || req.query.levelId;
    const levelData = await gameService.getLevelsConfig(levelId);
    
    if (!levelData) {
      throw new AppError('level not found', RESPONSE_CODE.NOT_FOUND, 404);
    }
    
    return success(res, levelData, 'get levels config success');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCode2Session,
  getUserWXContext,
  getUserGameInfo,
  setUserGameInfo,
  getUserRankList,
  getLevelsConfig
};

