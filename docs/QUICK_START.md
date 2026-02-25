# 快速开始

## 项目概述

Express服务端，支持微信小游戏、Unity Editor等多平台。

## 快速启动

```bash
npm install
npm start  # 服务运行在 http://localhost:3000
```

## 测试接口

### 开发环境测试

创建`.env`文件：
```bash
NODE_ENV=development
ENABLE_TEST_MODE=true
```

测试命令：
```bash
# 获取token
TOKEN=$(curl -s -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -d '{"platform":"Editor","code":"test"}' | jq -r '.data.token')

# 使用token访问接口
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"
```

## 核心API

所有接口路径前缀：`/api/minigame`

| 接口 | 说明 | 认证 |
|------|------|------|
| `POST /getCode2Session` | 登录获取token | 否 |
| `POST /getUserGameInfoV2` | 获取用户信息 | 是 |
| `POST /setUserGameInfoV2` | 更新用户信息 | 是 |
| `POST /getUserRankListV2` | 获取排行榜 | 是 |
| `POST /getLevelsConfigV2` | 获取关卡配置 | 是 |
| `POST /addCurrency` | 增加货币 | 是 |
| `POST /deductCurrency` | 扣除货币 | 是 |
| `POST /updateEnergy` | 更新体力 | 是 |

## Unity调用示例

```csharp
// 登录
var sessionResponse = await NetManager.CallHttp<SessionData>("getCode2Session", 
    new { platform = "Editor", code = "test" });
NetManager.AuthToken = sessionResponse.data.token;

// 获取用户信息
var userInfo = await NetManager.CallHttp<UserGameInfoData>("getUserGameInfoV2");
```

## 环境配置

### 必需配置
```bash
TCB_ENV=your-env-id           # 云开发环境ID
WX_APPID=your-wechat-appid    # 微信AppID
WX_SECRET=your-wechat-secret  # 微信Secret
TOKEN_SECRET=your-secret-key  # JWT密钥
```

### 可选配置
```bash
NODE_ENV=development          # 环境标识
ENABLE_TEST_MODE=true         # 测试模式（仅开发环境）
```

## 相关文档

- [AUTH_GUIDE.md](./AUTH_GUIDE.md) - 认证系统详细说明
- [TEST_API.md](./TEST_API.md) - API测试指南
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 部署指南
