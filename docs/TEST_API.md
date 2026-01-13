# API测试指南

本文档提供API接口的测试方法，帮助您验证服务是否正常运行。

## 前置准备

1. 确保服务已启动（本地或已部署）
2. 准备测试工具：
   - **Postman**（推荐）：图形化界面，易于使用
   - **curl**：命令行工具
   - **浏览器**：仅用于GET请求

## 本地测试

### 1. 启动服务

```bash
npm install
npm start
```

服务将在 `http://localhost:3000` 启动

### 2. 测试接口

#### 测试1：获取用户Token（登录）

**方式A：使用测试模式（推荐用于开发测试）**

首先在 `.env` 文件中设置：
```bash
ENABLE_TEST_MODE=true
TEST_TOKEN=any
```

然后测试：
```bash
# 测试模式登录（无需真实code）
curl -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -H "x-platform: test" \
  -d "{\"code\":\"test_code\"}"
```

**方式B：使用真实微信code（生产环境）**

```bash
# 注意：这个接口需要真实的微信登录code，可以从微信小程序获取
curl -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"YOUR_WECHAT_CODE\",\"platform\":\"wechat\"}"
```

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "openid": "user_openid",
    "platform": "wechat",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_key": "session_key"
  },
  "msg": "success"
}
```

#### 测试2：使用Token访问API（推荐方式）

```bash
# 使用Authorization Header（推荐）
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{}"

# 或使用自定义Header
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_TOKEN_HERE" \
  -d "{}"
```

#### 测试3：使用测试模式访问API（开发环境）

```bash
# 在开发环境启用测试模式后，可以使用测试token
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "x-test-token: any" \
  -H "x-test-openid: test123" \
  -d "{}"
```


**预期响应：**
```json
{
  "code": 0,
  "data": {
    "openid": "test123",
    "openID": "test123",
    "userGameInfo": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "progressLevelID": 0,
    "nickName": "",
    "avatarUrl": ""
  },
  "msg": "no result found, created empty info"
}
```

#### 测试5：设置用户游戏信息

```bash
# 使用Token（推荐）
curl -X POST http://localhost:3000/api/minigame/setUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"progressLevelID\":5,\"nickName\":\"测试玩家\",\"avatarUrl\":\"https://example.com/avatar.jpg\"}"

# 或使用测试模式
curl -X POST http://localhost:3000/api/minigame/setUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "x-test-token: any" \
  -H "x-test-openid: test123" \
  -d "{\"progressLevelID\":5,\"nickName\":\"测试玩家\",\"avatarUrl\":\"https://example.com/avatar.jpg\"}"
```

**预期响应：**
```json
{
  "code": 0,
  "data": {
    "openid": "test123",
    "progressLevelID": 5,
    "nickName": "测试玩家",
    "avatarUrl": "https://example.com/avatar.jpg",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "msg": "update user game info success"
}
```

#### 测试6：再次获取用户信息（验证数据已保存）

```bash
# 使用Token
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{}"
```

这次应该返回刚才设置的数据。

#### 测试7：获取排行榜

```bash
# 排行榜是可选认证，可以不传token
curl -X POST http://localhost:3000/api/minigame/getUserRankListV2 \
  -H "Content-Type: application/json" \
  -d "{\"limit\":10}"

# 或使用token（会显示用户排名）
curl -X POST http://localhost:3000/api/minigame/getUserRankListV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"limit\":10}"
```

#### 测试8：获取关卡配置

```bash
# 关卡配置是可选认证
curl -X POST http://localhost:3000/api/minigame/getLevelsConfigV2 \
  -H "Content-Type: application/json" \
  -d "{}"
```

## 使用Postman测试

1. **导入请求**：
   - 打开Postman
   - 创建新的Collection（集合）
   - 添加请求

2. **配置请求**：
   - **Method**: POST
   - **URL**: `http://localhost:3000/api/minigame/getUserGameInfoV2`
   - **Headers**: 
     - `Content-Type: application/json`
     - `Authorization: Bearer YOUR_TOKEN_HERE` （推荐）
     - 或 `x-test-token: any` + `x-test-openid: test123` （测试模式）
   - **Body** (选择raw, JSON格式):
     ```json
     {}
     ```

3. **发送请求**：点击Send按钮

## 完整测试流程

以下是一个完整的测试流程，模拟真实使用场景：

```bash
# 1. 获取Token（登录）
TOKEN1=$(curl -s -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -H "x-platform: test" \
  -d '{"code":"test_code_001"}' | jq -r '.data.token')

TOKEN2=$(curl -s -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -H "x-platform: test" \
  -d '{"code":"test_code_002"}' | jq -r '.data.token')

# 2. 创建用户并设置游戏信息（使用Token）
curl -X POST http://localhost:3000/api/minigame/setUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{"progressLevelID":10,"nickName":"玩家1"}'

# 3. 创建另一个用户
curl -X POST http://localhost:3000/api/minigame/setUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{"progressLevelID":20,"nickName":"玩家2"}'

# 4. 获取排行榜（应该能看到这两个玩家）
curl -X POST http://localhost:3000/api/minigame/getUserRankListV2 \
  -H "Content-Type: application/json" \
  -d "{}"

# 5. 获取玩家1的信息
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d "{}"
```

## 部署后测试

部署到腾讯云托管后，使用以下 curl 命令直接测试（可直接复制到命令行）：

### ⚡ 快速测试命令（直接复制使用）

#### Windows PowerShell 版本：

```powershell
# 测试1: 获取用户游戏信息
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: test123" -d "{}"

# 测试2: 设置用户游戏信息
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: test123" -d "{\"progressLevelID\":5,\"nickName\":\"测试玩家\",\"avatarUrl\":\"https://example.com/avatar.jpg\"}"

# 测试3: 获取排行榜
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserRankListV2 -H "Content-Type: application/json" -d "{\"limit\":10}"

# 测试4: 获取关卡配置
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getLevelsConfigV2 -H "Content-Type: application/json" -d "{}"

# 测试5: 获取用户信息（使用body传递openid）
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfoV2 -H "Content-Type: application/json" -d "{\"openid\":\"test123\"}"
```

#### Linux/Mac 版本：

```bash
# 测试1: 获取用户游戏信息
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: test123" -d "{}"

# 测试2: 设置用户游戏信息
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: test123" -d '{"progressLevelID":5,"nickName":"测试玩家","avatarUrl":"https://example.com/avatar.jpg"}'

# 测试3: 获取排行榜
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserRankListV2 -H "Content-Type: application/json" -d '{"limit":10}'

# 测试4: 获取关卡配置
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getLevelsConfigV2 -H "Content-Type: application/json" -d "{}"

# 测试5: 获取用户信息（使用body传递openid）
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfoV2 -H "Content-Type: application/json" -d '{"openid":"test123"}'
```

### 📋 完整测试流程（按顺序执行）

#### Windows PowerShell：

```powershell
# 步骤1: 创建用户并设置游戏信息
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: player001" -d "{\"progressLevelID\":10,\"nickName\":\"玩家1\"}"

# 步骤2: 创建另一个用户
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: player002" -d "{\"progressLevelID\":20,\"nickName\":\"玩家2\"}"

# 步骤3: 获取排行榜（应该能看到这两个玩家）
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserRankListV2 -H "Content-Type: application/json" -d "{}"

# 步骤4: 获取玩家1的信息
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: player001" -d "{}"
```

#### Linux/Mac：

```bash
# 步骤1: 创建用户并设置游戏信息
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: player001" -d '{"progressLevelID":10,"nickName":"玩家1"}'

# 步骤2: 创建另一个用户
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: player002" -d '{"progressLevelID":20,"nickName":"玩家2"}'

# 步骤3: 获取排行榜（应该能看到这两个玩家）
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserRankListV2 -H "Content-Type: application/json" -d "{}"

# 步骤4: 获取玩家1的信息
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: player001" -d "{}"
```

### 🔍 预期响应示例

**成功响应示例**（获取用户信息）：
```json
{
  "code": 0,
  "data": {
    "openid": "test123",
    "openID": "test123",
    "userGameInfo": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "progressLevelID": 0,
    "nickName": "",
    "avatarUrl": ""
  },
  "msg": "no result found, created empty info"
}
```

### 💡 使用 Postman 测试

1. 创建新的请求
2. **Method**: POST
3. **URL**: `https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfoV2`
4. **Headers**: 
   - `Content-Type: application/json`
   - `x-openid: test123`
5. **Body** (raw, JSON):
   ```json
   {}
   ```
6. 点击 Send

## 错误处理测试

测试错误情况，确保接口能正确处理：

```bash
# 测试缺少认证信息的情况（生产环境）
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -d "{}"

# 预期响应：
# {
#   "code": -2,
#   "msg": "Authentication required. Please provide a valid token or enable test mode."
# }

# 测试无效token的情况
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token" \
  -d "{}"

# 预期响应：同样返回认证错误
```

## 注意事项

1. **数据库配置**：确保已配置 `TCB_ENV` 环境变量，指向正确的云开发环境
2. **认证配置**：
   - 开发环境：设置 `ENABLE_TEST_MODE=true` 和 `TEST_TOKEN=any` 启用测试模式
   - 生产环境：必须使用真实的token，禁用测试模式
3. **Token管理**：客户端需要保存token并在后续请求中携带，token有效期为7天
4. **微信code**：`getCode2Session` 接口需要真实的微信登录code，测试时可以使用测试模式
5. **跨域问题**：如果从浏览器直接调用，可能遇到跨域问题，需要配置CORS
6. **仅支持Token认证**：系统仅支持token认证和测试模式，不再支持直接传递openid

## 认证系统详细说明

更多关于认证系统的使用说明，请参考：[认证系统使用指南](./AUTH_GUIDE.md)

## 下一步

测试通过后，您可以：
1. 查看 `DEPLOYMENT_GUIDE.md` 了解如何部署到腾讯云
2. 查看代码了解如何连接真实数据库
3. 根据实际需求调整API接口
