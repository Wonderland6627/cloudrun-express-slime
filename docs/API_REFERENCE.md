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
    "resources": {
      "1": 0,
      "2": 150,
      "3": 0
    }
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
  "limit": 100
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
  "levelId": 1
}
```

## 资源系统

### ResourceType 枚举

| ID | 名称 | 说明 |
|----|------|------|
| 1 | Coin | 金币 |
| 2 | Energy | 体力 |
| 3 | Diamond | 钻石 |

### 更新资源
```
POST /updateResource
Authorization: Bearer <token>
```

**请求参数**：
```json
{
  "resourceType": 1,
  "change": 100,
  "source": "level_reward"
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "resourceType": 1,
    "value": 600,
    "change": 100
  }
}
```

### 获取所有资源
```
POST /getResources
Authorization: Bearer <token>
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "resources": {
      "1": 500,
      "2": 80,
      "3": 0
    }
  }
}
```

### ResourceSource 来源枚举

| 值 | 说明 |
|----|------|
| daily_checkin | 每日签到 |
| level_reward | 推关奖励 |
| first_clear | 首次通关 |
| star_reward | 星级奖励 |
| daily_task | 每日任务 |
| achievement | 成就奖励 |
| daily_login | 每日登录 |
| ad_reward | 广告奖励 |
| chest_reward | 宝箱奖励 |
| level_consume | 关卡消耗 |

## 通关奖励

### 领取通关奖励
```
POST /claimLevelReward
Authorization: Bearer <token>
```

**请求参数**：
```json
{
  "levelId": 1,
  "watchedAd": false
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "rewards": [
      { "resourceType": 1, "amount": 100, "source": "level_reward" },
      { "resourceType": 2, "amount": 3, "source": "level_reward" }
    ],
    "isFirstClear": true
  }
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

// 增加金币（ResourceType.Coin = 1）
await NetManager.CallHttp<UpdateResourceResponse>("updateResource", 
    new { resourceType = 1, change = 100, source = "level_reward" });

// 扣除体力（ResourceType.Energy = 2）
await NetManager.CallHttp<UpdateResourceResponse>("updateResource", 
    new { resourceType = 2, change = -10, source = "level_consume" });

// 获取所有资源
var resources = await NetManager.CallHttp<GetResourcesResponse>("getResources");
```
