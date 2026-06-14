// 版本信息模块
// 用于标识当前部署的代码版本，并辅助对比正式服/测试服实例差异

const fs = require('fs');
const os = require('os');
const path = require('path');
const { logger } = require('./logger');

const serviceStartTime = new Date().toISOString();

// 从 package.json 获取版本号
let packageVersion = '0.0.0';
try {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageVersion = packageData.version || '0.0.0';
} catch (error) {
  logger.warn('Failed to read package.json version', { error: error.message });
}

/**
 * 获取部署时写入的构建时间
 * 优先使用环境变量，便于正式服/测试服直接对比镜像来源
 * @returns {string}
 */
function getBuildTime() {
  return (
    process.env.BUILD_TIME ||
    process.env.RELEASE_BUILD_TIME ||
    process.env.IMAGE_BUILD_TIME ||
    serviceStartTime
  );
}

/**
 * 获取部署标识
 * 允许通过环境变量透出 commit / tag，便于跨环境核对版本
 * @returns {string|null}
 */
function getRevision() {
  const revision =
    process.env.GIT_COMMIT_SHA ||
    process.env.COMMIT_SHA ||
    process.env.RELEASE_VERSION ||
    process.env.IMAGE_TAG ||
    '';

  if (!revision) return null;
  return revision.length > 12 ? revision.slice(0, 12) : revision;
}

/**
 * 获取版本信息
 * @returns {Object} 版本信息对象
 */
function getVersionInfo() {
  return {
    version: packageVersion,
    buildTime: getBuildTime(),
    startedAt: serviceStartTime,
    revision: getRevision(),
    environment: process.env.NODE_ENV || 'development',
    testMode: process.env.ENABLE_TEST_MODE === 'true',
    instance: os.hostname()
  };
}

/**
 * 获取版本信息字符串（用于日志输出）
 * @returns {string}
 */
function getVersionString() {
  const info = getVersionInfo();
  const revisionText = info.revision ? `, rev: ${info.revision}` : '';
  return `v${info.version} (build: ${info.buildTime}${revisionText}, env: ${info.environment}, instance: ${info.instance})`;
}

module.exports = {
  getVersionInfo,
  getVersionString
};

