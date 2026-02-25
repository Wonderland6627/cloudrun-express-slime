# API参考文档

## 基础信息

- **Base URL**: `/api/minigame`
- **认证方式**: Bearer Token
- **响应格式**: JSON

## 认证

### 获取Token
```
POST /getCode2Session
```

**请求参数**：
```json
{
  "code": "string",      // 平台登录code
  "platform": "string"   // wechat | Editor | douyin | bilibili
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "openid": "string",
    "token": "string",
    "platform": "string"
  }
}
```

## 用户信息

### 获取用户信息
```
POST /getUserGameInfoV2
Authorization: Bearer <token>
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "openID": "string",
    "progressLevelID": 0,
    "nickName": "string",
    "avatarUrl": "string",
    "coin": 0,
    "energy": 0,
    "maxEnergy": 100
  }
}
```

### 更新用户信息
```
POST /setUserGameInfoV2
Authorization: Bearer <token>
```

**请求参数**：
```json
{
  "progressLevelID": 0,
  "nickName": "string",
  "avatarUrl": "string"
}
```

## 游戏数据

### 获取排行榜
```
POST /getUserRankListV2
Authorization: Bearer <token>
```

**请求参数**：
```json
{
  "limit": 100  // 可选，默认100
}
```

### 获取关卡配置
```
POST /getLevelsConfigV2
Authorization: Bearer <token>
```

**请求参数**：
```json
{
  "levelId": 1  // 可选，不传返回所有关卡
}
```

## 货币系统

### 增加货币
```
POST /addCurrency
Authorization: Bearer <token>
```

**请求参数**：
```json
{
  "currencyType": "coin",  // coin | diamond
  "amount": 100,
  "source": "string",      // level_reward | daily_checkin | first_clear
  "metadata": {}           // 可选
}
```

### 扣除货币
```
POST /deductCurrency
Authorization: Bearer <token>
```

**请求参数**：
```json
{
  "currencyType": "coin",
  "amount": 50,
  "reason": "string"
}
```

### 便捷接口
```
POST /addCoin      // 等同于 addCurrency(currencyType="coin")
POST /deductCoin   // 等同于 deductCurrency(currencyType="coin")
```

## 体力系统

### 更新体力
```
POST /updateEnergy
Authorization: Bearer <token>
```

**请求参数**：
```json
{
  "change": -10,           // 正数增加，负数扣除
  "source": "string"       // level_play | time_recovery
}
```

## 错误码

| Code | 说明 |
|------|------|
| 0 | 成功 |
| -1 | 通用错误 |
| -2 | 未授权（Token无效/过期） |
| -3 | 资源未找到 |
| -4 | 参数验证失败 |

## Unity调用示例

```csharp
// 登录
var session = await NetManager.CallHttp<SessionData>("getCode2Session", 
    new { platform = "Editor", code = "test" });
NetManager.AuthToken = session.data.token;

// 获取用户信息
var userInfo = await NetManager.CallHttp<UserGameInfoData>("getUserGameInfoV2");

// 更新用户信息
await NetManager.CallHttp<object>("setUserGameInfoV2", 
    new { progressLevelID = 5, nickName = "玩家" });

// 增加金币
await NetManager.CallHttp<object>("addCoin", 
    new { amount = 100, source = "level_reward" });

// 扣除金币
await NetManager.CallHttp<object>("deductCoin", 
    new { amount = 50, reason = "refresh_reward" });

// 更新体力
await NetManager.CallHttp<object>("updateEnergy", 
    new { change = -10, source = "level_play" });
```
