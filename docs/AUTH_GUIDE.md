# 认证系统使用指南

## 概述

本系统实现了多平台认证机制，支持微信小游戏、抖音小游戏、B站小游戏等平台，并提供了测试模式用于开发调试。

## 认证流程

### 1. 获取Token（登录）

客户端通过 `code` 获取用户信息和token：

**请求示例：**
```bash
POST /api/minigame/getCode2Session
Content-Type: application/json

{
  "code": "微信/抖音/B站返回的code",
  "platform": "wechat"  // 可选，默认wechat
}
```

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "openid": "user_openid",
    "platform": "wechat",
    "unionid": "unionid_if_available",
    "session_key": "session_key",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "appid": "wx_appid"
  },
  "msg": "success"
}
```

### 2. 使用Token访问API

获取token后，客户端需要在后续请求中携带token：

**方式1：Authorization Header（推荐）**
```bash
POST /api/minigame/getUserGameInfoV2
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**方式2：自定义Header**
```bash
POST /api/minigame/getUserGameInfoV2
x-auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**方式3：请求Body**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**方式4：Query参数**
```
GET /api/minigame/getUserGameInfoV2?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 测试模式（Editor平台）

为了支持Unity编辑器或测试环境，系统提供了Editor平台测试模式：

### 启用测试模式

设置环境变量：
```bash
ENABLE_TEST_MODE=true
TEST_OPENID=editor_test_user  # 可选，不设置则自动生成
```

### 使用测试模式

**获取测试token**：
```bash
POST /api/minigame/getCode2Session
Content-Type: application/json

{
  "platform": "Editor",
  "code": "any_code_here"  # code可以是任意值
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "openid": "editor_test_user",
    "platform": "editor",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_key": "editor_test_session_key"
  },
  "msg": "success"
}
```

**使用token访问接口**：
```bash
POST /api/minigame/getUserGameInfoV2
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 测试模式特点

- 无需真实的微信code，code可以是任意值
- 测试环境需要设置 `ENABLE_TEST_MODE=true`
- 生产环境设置 `ENABLE_TEST_MODE=false` 时，Editor平台不可用
- 所有接口都需要使用token认证，无法绕过

## 平台支持

### 微信小游戏（wechat）

```json
{
  "code": "wx_code_from_miniprogram",
  "platform": "wechat"
}
```

需要环境变量：
- `WX_APPID`: 微信小程序AppID
- `WX_SECRET`: 微信小程序Secret

### 抖音小游戏（douyin）

```json
{
  "code": "douyin_code",
  "platform": "douyin"
}
```

**注意：** 抖音平台认证待实现，当前会抛出错误。

### B站小游戏（bilibili）

```json
{
  "code": "bilibili_code",
  "platform": "bilibili"
}
```

**注意：** B站平台认证待实现，当前会抛出错误。

## 环境变量配置

### 必需配置

```bash
# Token密钥（生产环境必须修改）
TOKEN_SECRET=your-secret-key-change-in-production

# 微信平台
WX_APPID=your_wechat_appid
WX_SECRET=your_wechat_secret
```

### 可选配置

```bash
# 测试模式
ENABLE_TEST_MODE=false          # 是否启用测试模式
TEST_OPENID=editor_test_user    # 默认测试openid（可选）

```

## API认证要求

| API路径 | 认证要求 | 说明 |
|---------|---------|------|
| `/api/minigame/getCode2Session` | 无需认证 | 登录接口 |
| `/api/minigame/getUserWXContext` | 必需 | 需要token或测试模式 |
| `/api/minigame/getUserGameInfoV2` | 必需 | 需要token或测试模式 |
| `/api/minigame/setUserGameInfoV2` | 必需 | 需要token或测试模式 |
| `/api/minigame/getUserRankListV2` | 必需 | 需要token认证 |
| `/api/minigame/getLevelsConfigV2` | 必需 | 需要token认证 |

## 安全建议

1. **生产环境必须修改TOKEN_SECRET**：使用强随机字符串
2. **禁用测试模式**：生产环境设置 `ENABLE_TEST_MODE=false`
3. **使用HTTPS**：确保token传输安全
4. **Token过期时间**：当前设置为7天，可根据需要调整
5. **必须使用Token认证**：系统仅支持token认证，不再支持直接传递openid

## 扩展新平台

要添加新平台支持，需要：

1. 在 `utils/platformAuth.js` 中添加新的平台认证类
2. 实现 `code2Session` 和 `verifySession` 方法
3. 在 `PLATFORM_TYPES` 中添加平台类型
4. 更新 `PlatformAuthFactory.getAuthInstance` 方法

示例：
```javascript
class NewPlatformAuth {
  constructor() {
    this.platform = 'newplatform';
  }
  
  async code2Session(code) {
    // 实现登录逻辑
  }
  
  async verifySession(openid, session_key) {
    // 实现验证逻辑
  }
}
```

## 常见问题

### Q: Token过期了怎么办？
A: 客户端需要重新调用 `getCode2Session` 获取新token。

### Q: 如何在编辑器/测试工具中使用？
A: 启用测试模式，设置 `ENABLE_TEST_MODE=true`，然后使用 `platform="Editor"` 调用 `getCode2Session` 获取测试token，之后使用token访问其他接口。

### Q: 可以同时支持多个平台吗？
A: 可以，系统会根据请求中的 `platform` 参数自动选择对应的认证方式。

### Q: 是否支持直接传递openid？
A: 不支持。系统仅支持token认证和测试模式，必须通过 `getCode2Session` 获取token后使用。

