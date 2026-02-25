# 认证系统指南

## 认证流程

### 1. 获取Token

**请求**：
```bash
POST /api/minigame/getCode2Session
Content-Type: application/json

{
  "code": "平台登录code",
  "platform": "wechat"  // wechat | Editor | douyin | bilibili
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "openid": "user_openid",
    "platform": "wechat",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_key": "session_key"
  }
}
```

### 2. 使用Token访问API

**推荐方式（Authorization Header）**：
```bash
POST /api/minigame/getUserGameInfoV2
Authorization: Bearer <token>
Content-Type: application/json
```

**备选方式**：
- Header: `x-auth-token: <token>`
- Body: `{"token": "<token>"}`
- Query: `?token=<token>`

## 平台支持

### 微信小游戏（wechat）
```json
{
  "code": "wx_code_from_miniprogram",
  "platform": "wechat"
}
```

需要环境变量：
- `WX_APPID`: 微信AppID
- `WX_SECRET`: 微信Secret

### Editor平台（测试模式）
```json
{
  "code": "any_value",
  "platform": "Editor"
}
```

需要环境变量：
- `ENABLE_TEST_MODE=true`（仅开发环境）
- `TEST_OPENID=editor_test_user`（可选）

### 其他平台
- 抖音（douyin）：待实现
- B站（bilibili）：待实现

## 接口认证要求

| API | 认证要求 |
|-----|---------|
| `/getCode2Session` | 无需认证 |
| 其他所有接口 | 必需Token |

## 环境配置

### 开发环境
```bash
NODE_ENV=development
ENABLE_TEST_MODE=true
TEST_OPENID=editor_test_user
```

### 生产环境
```bash
NODE_ENV=production
ENABLE_TEST_MODE=false
TOKEN_SECRET=<强随机字符串>
```

## Token管理

- **有效期**：7天
- **存储**：客户端自行存储
- **过期处理**：重新调用`getCode2Session`获取新token
- **安全建议**：
  - 生产环境必须修改`TOKEN_SECRET`
  - 使用HTTPS传输
  - 禁用测试模式

## 错误码

| Code | 说明 |
|------|------|
| 0 | 成功 |
| -2 | Token无效/过期 |
| -4 | 参数验证失败 |

## 扩展新平台

在`utils/platformAuth.js`中：
1. 添加平台认证类
2. 实现`code2Session`方法
3. 在`PlatformAuthFactory`中注册

```javascript
class NewPlatformAuth {
  async code2Session(code) {
    // 实现登录逻辑
  }
}
```
