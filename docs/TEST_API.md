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

#### 测试1：获取微信用户信息（需要真实的code）

```bash
# 注意：这个接口需要真实的微信登录code，可以从微信小程序获取
curl -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"YOUR_WECHAT_CODE\"}"
```

#### 测试2：获取用户游戏信息

```bash
curl -X POST http://localhost:3000/api/minigame/getUserGameInfo \
  -H "Content-Type: application/json" \
  -H "x-openid: test123" \
  -d "{}"
```

或者使用body传递openid：

```bash
curl -X POST http://localhost:3000/api/minigame/getUserGameInfo \
  -H "Content-Type: application/json" \
  -d "{\"openid\":\"test123\"}"
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

#### 测试3：设置用户游戏信息

```bash
curl -X POST http://localhost:3000/api/minigame/setUserGameInfo \
  -H "Content-Type: application/json" \
  -H "x-openid: test123" \
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

#### 测试4：再次获取用户信息（验证数据已保存）

```bash
curl -X POST http://localhost:3000/api/minigame/getUserGameInfo \
  -H "Content-Type: application/json" \
  -H "x-openid: test123" \
  -d "{}"
```

这次应该返回刚才设置的数据。

#### 测试5：获取排行榜

```bash
curl -X POST http://localhost:3000/api/minigame/getUserRankList \
  -H "Content-Type: application/json" \
  -d "{\"limit\":10}"
```

#### 测试6：获取关卡配置

```bash
curl -X POST http://localhost:3000/api/minigame/getLevelsConfig \
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
   - **URL**: `http://localhost:3000/api/minigame/getUserGameInfo`
   - **Headers**: 
     - `Content-Type: application/json`
     - `x-openid: test123`
   - **Body** (选择raw, JSON格式):
     ```json
     {}
     ```

3. **发送请求**：点击Send按钮

## 完整测试流程

以下是一个完整的测试流程，模拟真实使用场景：

```bash
# 1. 创建用户并设置游戏信息
curl -X POST http://localhost:3000/api/minigame/setUserGameInfo \
  -H "Content-Type: application/json" \
  -H "x-openid: player001" \
  -d "{\"progressLevelID\":10,\"nickName\":\"玩家1\"}"

# 2. 创建另一个用户
curl -X POST http://localhost:3000/api/minigame/setUserGameInfo \
  -H "Content-Type: application/json" \
  -H "x-openid: player002" \
  -d "{\"progressLevelID\":20,\"nickName\":\"玩家2\"}"

# 3. 获取排行榜（应该能看到这两个玩家）
curl -X POST http://localhost:3000/api/minigame/getUserRankList \
  -H "Content-Type: application/json" \
  -d "{}"

# 4. 获取玩家1的信息
curl -X POST http://localhost:3000/api/minigame/getUserGameInfo \
  -H "Content-Type: application/json" \
  -H "x-openid: player001" \
  -d "{}"
```

## 部署后测试

部署到腾讯云托管后，将URL替换为您的服务域名：

```bash
# 替换 YOUR_DOMAIN 为您的实际域名
curl -X POST https://YOUR_DOMAIN/api/minigame/getUserGameInfo \
  -H "Content-Type: application/json" \
  -H "x-openid: test123" \
  -d "{}"
```

## 错误处理测试

测试错误情况，确保接口能正确处理：

```bash
# 测试缺少openid的情况
curl -X POST http://localhost:3000/api/minigame/getUserGameInfo \
  -H "Content-Type: application/json" \
  -d "{}"

# 预期响应：
# {
#   "code": -1,
#   "msg": "openid is required"
# }
```

## 注意事项

1. **内存数据库限制**：当前使用内存数据库，服务重启后数据会丢失
2. **微信code**：`getCode2Session` 接口需要真实的微信登录code，测试时可能无法使用
3. **跨域问题**：如果从浏览器直接调用，可能遇到跨域问题，需要配置CORS

## 下一步

测试通过后，您可以：
1. 查看 `DEPLOYMENT_GUIDE.md` 了解如何部署到腾讯云
2. 查看代码了解如何连接真实数据库
3. 根据实际需求调整API接口
