// 版本信息模块
// 用于标识当前部署的代码版本

const fs = require('fs');
const path = require('path');

// 获取构建时间（部署时间）
const buildTime = new Date().toISOString();

// 尝试获取Git信息（如果存在）
let gitInfo = {
  commit: null,
  branch: null,
  commitTime: null
};

try {
  // 尝试读取 .git/HEAD 获取当前分支
  const headPath = path.join(__dirname, '..', '.git', 'HEAD');
  if (fs.existsSync(headPath)) {
    const headContent = fs.readFileSync(headPath, 'utf8').trim();
    if (headContent.startsWith('ref:')) {
      gitInfo.branch = headContent.replace('ref: refs/heads/', '');
    } else {
      gitInfo.commit = headContent.substring(0, 7);
    }
  }

  // 尝试读取 .git/COMMIT_EDITMSG 或通过其他方式获取commit hash
  // 注意：在Docker构建时，.git目录可能不存在
} catch (error) {
  // Git信息不可用时忽略错误
}

// 从package.json获取版本号
let packageVersion = '0.0.0';
try {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageVersion = packageData.version || '0.0.0';
} catch (error) {
  console.warn('Failed to read package.json version:', error.message);
}

/**
 * 获取版本信息
 * @returns {Object} 版本信息对象
 */
function getVersionInfo() {
  return {
    version: packageVersion,
    buildTime: buildTime,
    git: {
      commit: gitInfo.commit || 'unknown',
      branch: gitInfo.branch || 'unknown'
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * 获取版本信息字符串（用于日志输出）
 * @returns {string}
 */
function getVersionString() {
  const info = getVersionInfo();
  return `v${info.version} (build: ${info.buildTime}, node: ${info.nodeVersion})`;
}

module.exports = {
  getVersionInfo,
  getVersionString
};

