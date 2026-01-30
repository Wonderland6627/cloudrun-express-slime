// 体力值服务层（业务逻辑）
const cloudbaseDB = require('../utils/cloudbaseDB');
const { ENERGY } = require('../config/constants');

/**
 * 更新体力值（服务端校验）
 * 客户端传入变化量，服务端校验并返回结果
 * @param {string} openid - 用户openid
 * @param {number} change - 体力值变化量（正数为增加，负数为减少）
 * @param {string} source - 体力值变化来源
 * @returns {Promise<Object>} 更新结果 { success: boolean, energy: number, message?: string }
 */
async function updateEnergy(openid, change, source) {
  // 查询用户当前体力值
  const userData = await cloudbaseDB.findUserByOpenID(openid);
  if (!userData) {
    throw new Error('User not found');
  }
  
  // 懒加载：如果字段不存在，初始化为最大值
  if (userData.energy === undefined || userData.energy === null) {
    await cloudbaseDB.updateUser(openid, { energy: ENERGY.MAX });
    userData.energy = ENERGY.MAX;
  }
  
  const currentEnergy = userData.energy || 0;
  const newEnergy = currentEnergy + change;
  
  // 校验范围：新值必须在 0-ENERGY.MAX 范围内
  if (newEnergy < 0 || newEnergy > ENERGY.MAX) {
    return {
      success: false,
      energy: currentEnergy,
      message: `Energy out of range. Current: ${currentEnergy}, Change: ${change}, Result: ${newEnergy}, Max: ${ENERGY.MAX}`
    };
  }
  
  // 使用原子操作 inc 更新体力值
  const updatedUser = await cloudbaseDB.incrementCurrency(openid, 'energy', change);
  
  // 记录日志
  console.log(`[Energy] User ${openid} ${change > 0 ? 'added' : 'deducted'} ${Math.abs(change)} energy from ${source}. Current: ${updatedUser.energy}`);
  
  return {
    success: true,
    energy: updatedUser.energy || newEnergy
  };
}

module.exports = {
  updateEnergy
};

