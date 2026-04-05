// 版本信息模块
// 用于标识当前部署的代码版本

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

// 获取构建时间（部署时间）
const buildTime = new Date().toISOString();

// 从package.json获取版本号
let packageVersion = '0.0.0';
try {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageVersion = packageData.version || '0.0.0';
} catch (error) {
  logger.warn('Failed to read package.json version', { error: error.message });
}

/**
 * 获取版本信息
 * @returns {Object} 版本信息对象
 */
function getVersionInfo() {
  return {
    version: packageVersion,
    buildTime: buildTime
  };
}

/**
 * 获取版本信息字符串（用于日志输出）
 * @returns {string}
 */
function getVersionString() {
  const info = getVersionInfo();
  return `v${info.version} (build: ${info.buildTime})`;
}

module.exports = {
  getVersionInfo,
  getVersionString
};

