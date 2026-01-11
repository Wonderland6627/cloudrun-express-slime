// 内存数据库模拟模块（用于演示，实际部署时需要替换为真实数据库）
// 注意：内存数据在服务重启后会丢失，仅用于测试

class MockDatabase {
  constructor() {
    // 模拟UserGameInfos集合
    this.userGameInfos = new Map();
    // 模拟Levels集合
    this.levels = new Map();
    
    // 初始化一些测试数据
    this.initTestData();
  }

  initTestData() {
    // 初始化一个测试关卡配置
    this.levels.set('c0a2d8e468439784021a265910ba40eb', {
      _id: 'c0a2d8e468439784021a265910ba40eb',
      levelName: '测试关卡',
      levelData: {
        // 关卡数据
      }
    });
  }

  // UserGameInfos 集合操作
  async getUserGameInfo(openid) {
    const user = this.userGameInfos.get(openid);
    if (!user) {
      // 如果不存在，创建空记录
      const now = new Date();
      const emptyData = {
        openid: openid,
        openID: openid, // V2版本字段
        userGameInfo: {},
        createdAt: now,
        updatedAt: now,
        progressLevelID: 0,
        nickName: '',
        avatarUrl: ''
      };
      this.userGameInfos.set(openid, emptyData);
      return emptyData;
    }
    return user;
  }

  async setUserGameInfo(openid, gameInfo) {
    const now = new Date();
    const existing = this.userGameInfos.get(openid);
    
    if (!existing) {
      // 创建新记录
      const newData = {
        openid: openid,
        openID: openid,
        userGameInfo: gameInfo,
        createdAt: now,
        updatedAt: now,
        progressLevelID: gameInfo.progressLevelID || 0,
        nickName: gameInfo.nickName || '',
        avatarUrl: gameInfo.avatarUrl || ''
      };
      this.userGameInfos.set(openid, newData);
      return newData;
    } else {
      // 更新现有记录
      const updated = {
        ...existing,
        userGameInfo: { ...existing.userGameInfo, ...gameInfo },
        updatedAt: now
      };
      
      // 更新V2版本字段
      if (gameInfo.progressLevelID !== undefined) {
        updated.progressLevelID = gameInfo.progressLevelID;
      }
      if (gameInfo.nickName !== undefined) {
        updated.nickName = gameInfo.nickName;
      }
      if (gameInfo.avatarUrl !== undefined) {
        updated.avatarUrl = gameInfo.avatarUrl;
      }
      
      this.userGameInfos.set(openid, updated);
      return updated;
    }
  }

  async getUserRankList(limit = 100) {
    // 获取所有用户，按progressLevelID降序排序
    const users = Array.from(this.userGameInfos.values())
      .filter(user => (user.progressLevelID || 0) > 0 && user.nickName)
      .sort((a, b) => (b.progressLevelID || 0) - (a.progressLevelID || 0))
      .slice(0, limit);
    
    return users;
  }

  // Levels 集合操作
  async getLevelsConfig(levelId) {
    const level = this.levels.get(levelId);
    if (!level) {
      return null;
    }
    return level;
  }
}

// 创建单例实例
const mockDB = new MockDatabase();

module.exports = mockDB;
