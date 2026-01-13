// 数据库配置
module.exports = {
  // CloudBase 环境ID
  getEnvId() {
    return process.env.TCB_ENV || process.env.ENV_ID;
  },
  
  // 认证配置
  getAuthConfig() {
    const config = {
      env: this.getEnvId()
    };
    
    // 如果提供了密钥，则使用密钥认证
    if (process.env.TCB_SECRET_ID && process.env.TCB_SECRET_KEY) {
      config.secretId = process.env.TCB_SECRET_ID;
      config.secretKey = process.env.TCB_SECRET_KEY;
    }
    
    return config;
  }
};

