# API 参考文档（当前实现）

## 基础信息

- Base URL（业务接口）：`/api/minigame`
- 认证方式：Bearer Token
- 请求方法：业务接口统一 `POST`

---

## 响应规范

业务接口统一返回：

```json
{
  "code": 0,
  "data": {},
  "msg": "success"
}
```

错误码：

- `0` 成功
- `-1` 通用错误
- `-2` 未授权
- `-3` 未找到
- `-4` 参数校验失败

---

## 公开接口（无需 Token）

### `POST /api/minigame/getCode2Session`

通过平台 code 获取会话信息并签发 JWT。

请求：

```json
{
  "code": "string",
  "platform": "wechat"
}
```

说明：

- `platform` 支持：`wechat` / `editor` / `douyin` / `bilibili`
- `editor` 平台仅在 `ENABLE_TEST_MODE=true` 时可用

响应 `data`：

```json
{
  "openid": "string",
  "platform": "wechat",
  "unionid": null,
  "session_key": "string",
  "token": "jwt-token",
  "appid": "wx-appid-or-null"
}
```

---

## 鉴权接口（需要 Token）

> Header：`Authorization: Bearer <token>`

### 1) 用户上下文

#### `POST /api/minigame/getUserWXContext`

响应 `data`：

```json
{
  "event": {},
  "openid": "string",
  "appid": "string-or-null",
  "unionid": null
}
```

### 2) 用户信息

#### `POST /api/minigame/getUserGameInfoV2`

首次请求不存在用户会自动建档。

响应 `data`（示例）：

```json
{
  "_id": "doc-id",
  "openID": "user-openid",
  "progressLevelID": 0,
  "nickName": "",
  "avatarUrl": "",
  "resources": { "1": 0, "2": 150, "3": 0 },
  "goods": {},
  "claimedLevelChests": []
}
```

#### `POST /api/minigame/setUserGameInfoV2`

更新用户信息（会过滤请求中的 `openid/openID`，以鉴权用户为准）。

请求示例：

```json
{
  "progressLevelID": 10,
  "nickName": "玩家A",
  "avatarUrl": "https://example.com/a.png"
}
```

### 3) 排行榜与关卡

#### `POST /api/minigame/getUserRankListV2`

请求示例：

```json
{ "limit": 100 }
```

返回按 `progressLevelID` 降序的用户列表（会带上当前用户兜底逻辑）。

#### `POST /api/minigame/getLevelsConfigV2`

请求示例（可选）：

```json
{ "levelId": "level-doc-id" }
```

返回 `Levels` 集合中对应文档。

### 4) 资源系统

#### `POST /api/minigame/updateResource`

请求：

```json
{
  "resourceType": 1,
  "change": 100,
  "source": "level_reward"
}
```

响应 `data`：

```json
{
  "resourceType": 1,
  "value": 600,
  "change": 100
}
```

#### `POST /api/minigame/getResources`

响应 `data`：

```json
{
  "resources": { "1": 500, "2": 120, "3": 0 }
}
```

### 5) 奖励结算

#### `POST /api/minigame/claimLevelReward`

请求：

```json
{
  "levelId": 12,
  "watchedAd": false
}
```

响应 `data`：

```json
{
  "rewards": [
    { "itemType": 1, "itemId": 1, "amount": 120, "source": "level_reward" }
  ],
  "isFirstClear": true
}
```

#### `POST /api/minigame/claimDailyCheckin`

请求：`{}`

响应 `data`：

```json
{
  "rewards": [],
  "resources": { "1": 520, "2": 120, "3": 0 },
  "goods": {}
}
```

#### `POST /api/minigame/claimLevelChest`

请求：

```json
{
  "chestLevelId": 9
}
```

响应 `data`：

```json
{
  "rewards": [],
  "claimedLevelChests": [3, 6, 9],
  "resources": { "1": 560, "2": 120, "3": 0 },
  "goods": { "1001": 1 }
}
```

---

## 资源与来源枚举

### ResourceType

- `1` Coin
- `2` Energy
- `3` Diamond

### ResourceSource

- `daily_checkin`
- `level_reward`
- `first_clear`
- `star_reward`
- `daily_task`
- `achievement`
- `daily_login`
- `ad_reward`
- `chest_reward`
- `level_consume`

---

## 其他接口

这些接口位于 `routes/index.js`，不属于 `minigame` 路由组：

- `GET /api/version`
- `POST /api/time`
- `GET /health`
