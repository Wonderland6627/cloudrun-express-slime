# API测试指南

## 本地测试

### 1. 启动服务
```bash
npm install
npm start  # http://localhost:3000
```

### 2. 配置测试环境
创建`.env`文件：
```bash
NODE_ENV=development
ENABLE_TEST_MODE=true
```

### 3. 测试流程

```bash
# 获取token
TOKEN=$(curl -s -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -d '{"platform":"Editor","code":"test"}' | jq -r '.data.token')

# 获取用户信息
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"

# 更新用户信息
curl -X POST http://localhost:3000/api/minigame/setUserGameInfoV2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progressLevelID":5,"nickName":"测试玩家"}'

# 获取排行榜
curl -X POST http://localhost:3000/api/minigame/getUserRankListV2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":10}'
```

## 部署后测试

替换URL为部署地址：
```bash
BASE_URL="https://your-domain.com"

# 获取token（生产环境需要真实微信code）
TOKEN=$(curl -s -X POST $BASE_URL/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -d '{"platform":"wechat","code":"YOUR_WECHAT_CODE"}' | jq -r '.data.token')

# 使用token访问接口
curl -X POST $BASE_URL/api/minigame/getUserGameInfoV2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"
```

## Postman测试

1. 创建Collection
2. 配置请求：
   - Method: POST
   - URL: `http://localhost:3000/api/minigame/getUserGameInfoV2`
   - Headers: 
     - `Content-Type: application/json`
     - `Authorization: Bearer <token>`
   - Body (raw JSON): `{}`

## 响应示例

### 成功响应
```json
{
  "code": 0,
  "data": {
    "openID": "test123",
    "progressLevelID": 0,
    "nickName": "",
    "coin": 0
  },
  "msg": "success"
}
```

### 错误响应
```json
{
  "code": -2,
  "msg": "Authentication required"
}
```

## 错误处理测试

```bash
# 测试缺少token
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Content-Type: application/json" \
  -d "{}"
# 预期: {"code": -2, "msg": "Authentication required"}

# 测试无效token
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d "{}"
# 预期: {"code": -2, "msg": "Invalid or expired token"}
```

## 注意事项

1. **开发环境**：使用Editor平台，设置`ENABLE_TEST_MODE=true`
2. **生产环境**：必须使用真实微信code，禁用测试模式
3. **Token管理**：token有效期7天，过期需重新获取
4. **跨域问题**：浏览器直接调用需要配置CORS
