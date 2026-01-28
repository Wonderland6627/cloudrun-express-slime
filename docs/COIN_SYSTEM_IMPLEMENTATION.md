# 货币系统实现方案文档（通用设计）

## 一、概述

本文档描述货币系统的完整实现方案，采用通用设计以支持多种货币类型（金币、钻石等）。包括数据库设计、后端处理逻辑、API接口设计以及前端数据同步机制。货币系统作为游戏经济主循环的基础，支持每日签到、推关奖励等多种获取方式。

**设计原则**：
- 使用数据库原子操作（`inc`/`dec`），避免并发问题
- 懒加载策略：老用户数据在使用时自动初始化，无需批量迁移
- 通用架构：支持未来扩展多种货币类型
- 简化接口：只提供增加和扣除接口，查询通过 `getUserGameInfoV2` 获取

---

## 二、数据库设计

### 2.1 字段设计

在 `UserGameInfos` 集合中，为每个用户文档添加货币相关字段：

**字段位置**：货币字段直接在文档顶层（与 `progressLevelID`、`nickName`、`avatarUrl` 等字段同级）

**字段定义**：

| 字段路径 | 类型 | 默认值 | 说明 | 是否必填 |
|---------|------|--------|------|----------|
| `coin` | Number | 0 | 用户当前金币数量 | 否（懒加载初始化） |
| `diamond` | Number | 0 | 用户当前钻石数量（未来扩展） | 否（懒加载初始化） |

**扩展性说明**：未来如需添加新的货币类型（如积分、体力等），只需在文档顶层添加对应字段即可，无需修改代码结构。

**数据结构示例**：

```json
{
  "_id": "073a77ac681a0c320284cee70fe9ff04",
  "openID": "ox0H160OiHbng6giS50wOp6YZ7R4",
  "progressLevelID": 2,
  "nickName": "Indey",
  "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/vi_32/...",
  "coin": 150,  // 新增字段，在顶层
  "createdAt": "2025-05-06T13:18:42.514Z",
  "updatedAt": "2025-05-06T13:50:00.139Z"
}
```

**注意**：`userGameInfo` 字段已弃用，所有字段（包括 `progressLevelID`、`nickName`、`avatarUrl`、`coin`）现在都直接在文档顶层。

### 2.2 索引设计

**索引名称**：`coin_index`（可选，用于排行榜查询）

**索引字段**：`coin`

**索引类型**：降序索引（用于金币排行榜）

**说明**：如果未来需要实现金币排行榜功能，可以添加此索引以提升查询性能。

---

## 三、老用户数据兼容方案

### 3.1 懒加载策略

采用**懒加载（Lazy Loading）**策略，**不需要整体刷新数据库老数据**。老用户的货币字段在使用到的时候自动初始化，无需批量迁移。

### 3.2 初始化时机

货币字段在以下场景自动初始化：

1. **增加货币时**：如果字段不存在，数据库原子操作会自动初始化为 0 后再增加
2. **扣除货币时**：如果字段不存在，先初始化为 0，再执行扣除操作

### 3.3 实现方式

**无需单独的校验函数**，在实际操作时通过数据库原子操作自动处理：

- 使用 `db.command.inc()` 增加时，如果字段不存在会自动初始化为 0 后再增加
- 使用 `db.command.dec()` 扣除时，需要先确保字段存在（通过 `set` 操作初始化），再执行扣除

**注意**：不需要在 `getUserGameInfo` 或 `setUserGameInfo` 中预先初始化，只在货币操作时处理即可。

---

## 四、后端货币变化处理

### 4.1 DAO层设计（数据库原子操作）

**文件位置**：`utils/cloudbaseDB.js`（修改）

**新增方法**：使用数据库原子操作，避免并发问题

```javascript
/**
 * 原子操作：增加货币
 * @param {string} openID - 用户openID
 * @param {string} currencyType - 货币类型（如：'coin', 'diamond'）
 * @param {number} amount - 增加的数量（必须 > 0）
 * @returns {Promise<Object>} 更新后的用户记录
 */
async function incrementCurrency(openID, currencyType, amount) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const _ = db.command;
    
    // 使用原子操作 inc，如果字段不存在会自动初始化为 0 后再增加
    await collection.where({
      openID: openID
    }).update({
      [currencyType]: _.inc(amount),
      updatedAt: new Date()
    });
    
    // 返回更新后的数据
    const updatedResult = await collection.where({
      openID: openID
    }).get();
    
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    
    throw new Error('User not found after update');
  } catch (error) {
    console.error('incrementCurrency error:', error);
    throw error;
  }
}

/**
 * 原子操作：扣除货币（带余额检查）
 * @param {string} openID - 用户openID
 * @param {string} currencyType - 货币类型（如：'coin', 'diamond'）
 * @param {number} amount - 扣除的数量（必须 > 0）
 * @returns {Promise<Object>} 更新后的用户记录
 */
async function decrementCurrency(openID, currencyType, amount) {
  try {
    const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
    const _ = db.command;
    
    // 先查询用户，检查余额
    const userData = await findUserByOpenID(openID);
    if (!userData) {
      throw new Error('User not found');
    }
    
    // 确保字段存在（懒加载初始化）
    const currentAmount = userData[currencyType] || 0;
    
    // 检查余额是否足够
    if (currentAmount < amount) {
      throw new Error(`Insufficient ${currencyType}`);
    }
    
    // 如果字段不存在，先初始化为 0
    if (userData[currencyType] === undefined || userData[currencyType] === null) {
      await collection.where({
        openID: openID
      }).update({
        [currencyType]: 0,
        updatedAt: new Date()
      });
    }
    
    // 使用原子操作 dec 扣除
    await collection.where({
      openID: openID,
      [currencyType]: _.gte(amount)  // 确保余额足够
    }).update({
      [currencyType]: _.inc(-amount),  // 负数表示扣除
      updatedAt: new Date()
    });
    
    // 返回更新后的数据
    const updatedResult = await collection.where({
      openID: openID
    }).get();
    
    if (updatedResult.data && updatedResult.data.length > 0) {
      return updatedResult.data[0];
    }
    
    throw new Error('User not found after update');
  } catch (error) {
    console.error('decrementCurrency error:', error);
    throw error;
  }
}
```

### 4.2 服务层设计（通用货币服务）

**文件位置**：`services/currencyService.js`（新建）

**核心方法**：通用货币操作，支持多种货币类型

```javascript
const cloudbaseDB = require('../utils/cloudbaseDB');

/**
 * 货币类型枚举
 */
const CURRENCY_TYPES = {
  COIN: 'coin',
  DIAMOND: 'diamond'  // 未来扩展
};

/**
 * 增加货币（通用方法）
 * @param {string} openid - 用户openid
 * @param {string} currencyType - 货币类型（如：'coin', 'diamond'）
 * @param {number} amount - 增加的数量（必须 > 0）
 * @param {string} source - 货币来源（如：'daily_checkin', 'level_reward', 'first_clear'）
 * @param {Object} metadata - 额外元数据（可选，如关卡ID、签到天数等）
 * @returns {Promise<Object>} 更新结果
 */
async function addCurrency(openid, currencyType, amount, source, metadata = {}) {
  // 参数验证
  if (!amount || amount <= 0) {
    throw new Error('Currency amount must be greater than 0');
  }
  
  if (!currencyType || typeof currencyType !== 'string') {
    throw new Error('Currency type is required');
  }
  
  // 使用数据库原子操作
  const updatedUser = await cloudbaseDB.incrementCurrency(openid, currencyType, amount);
  
  // 记录日志
  console.log(`[Currency] User ${openid} added ${amount} ${currencyType} from ${source}. Current: ${updatedUser[currencyType] || 0}`);
  
  return {
    [currencyType]: updatedUser[currencyType] || 0,
    added: amount,
    source: source,
    metadata: metadata
  };
}

/**
 * 扣除货币（通用方法）
 * @param {string} openid - 用户openid
 * @param {string} currencyType - 货币类型（如：'coin', 'diamond'）
 * @param {number} amount - 扣除的数量（必须 > 0）
 * @param {string} reason - 扣除原因（如：'refresh_reward', 'buy_item'）
 * @returns {Promise<Object>} 更新结果
 */
async function deductCurrency(openid, currencyType, amount, reason) {
  // 参数验证
  if (!amount || amount <= 0) {
    throw new Error('Currency amount must be greater than 0');
  }
  
  if (!currencyType || typeof currencyType !== 'string') {
    throw new Error('Currency type is required');
  }
  
  // 使用数据库原子操作（带余额检查）
  const updatedUser = await cloudbaseDB.decrementCurrency(openid, currencyType, amount);
  
  // 记录日志
  console.log(`[Currency] User ${openid} deducted ${amount} ${currencyType} for ${reason}. Current: ${updatedUser[currencyType] || 0}`);
  
  return {
    [currencyType]: updatedUser[currencyType] || 0,
    deducted: amount,
    reason: reason
  };
}

// 便捷方法：金币操作（向后兼容）
async function addCoin(openid, amount, source, metadata = {}) {
  return await addCurrency(openid, CURRENCY_TYPES.COIN, amount, source, metadata);
}

async function deductCoin(openid, amount, reason) {
  return await deductCurrency(openid, CURRENCY_TYPES.COIN, amount, reason);
}

module.exports = {
  addCurrency,
  deductCurrency,
  addCoin,
  deductCoin,
  CURRENCY_TYPES
};
```

### 4.3 控制器层设计

**文件位置**：`controllers/currencyController.js`（新建）

**核心接口**：

#### 4.3.1 增加货币接口

```javascript
/**
 * POST /api/minigame/addCurrency
 * 增加用户货币（通用接口，支持多种货币类型）
 * 请求参数：
 * {
 *   "currencyType": "coin",    // 必填，货币类型（如：'coin', 'diamond'）
 *   "amount": 100,              // 必填，增加的货币数量
 *   "source": "level_reward",   // 必填，货币来源
 *   "metadata": {               // 可选，额外数据
 *     "levelId": 1
 *   }
 * }
 */
async function addCurrency(req, res, next) {
  try {
    const openid = req.user.openid;  // 从认证中间件获取，确保是用户本人
    const { currencyType, amount, source, metadata } = req.body;
    
    if (!currencyType || !amount || !source) {
      throw new AppError('Missing required fields: currencyType, amount, source', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    
    const result = await currencyService.addCurrency(openid, currencyType, amount, source, metadata);
    return success(res, result, 'Add currency success');
  } catch (err) {
    next(err);
  }
}
```

#### 4.3.2 扣除货币接口

```javascript
/**
 * POST /api/minigame/deductCurrency
 * 扣除用户货币（通用接口，支持多种货币类型）
 * 请求参数：
 * {
 *   "currencyType": "coin",    // 必填，货币类型（如：'coin', 'diamond'）
 *   "amount": 50,               // 必填，扣除的货币数量
 *   "reason": "refresh_reward"  // 必填，扣除原因
 * }
 */
async function deductCurrency(req, res, next) {
  try {
    const openid = req.user.openid;  // 从认证中间件获取，确保是用户本人
    const { currencyType, amount, reason } = req.body;
    
    if (!currencyType || !amount || !reason) {
      throw new AppError('Missing required fields: currencyType, amount, reason', RESPONSE_CODE.VALIDATION_ERROR, 400);
    }
    
    const result = await currencyService.deductCurrency(openid, currencyType, amount, reason);
    return success(res, result, 'Deduct currency success');
  } catch (err) {
    next(err);
  }
}
```

**注意**：所有操作都针对发起请求的用户本身（通过 `req.user.openid` 获取），游戏逻辑不会有获取他人货币的功能。

### 4.4 路由层设计

**文件位置**：`routes/minigame.js`（修改）

**新增路由**：

```javascript
// 货币相关路由（通用接口）
router.post('/addCurrency',
  authMiddleware,
  currencyController.addCurrency
);

router.post('/deductCurrency',
  authMiddleware,
  currencyController.deductCurrency
);

// 便捷路由：金币操作（向后兼容，内部调用通用接口）
router.post('/addCoin',
  authMiddleware,
  async (req, res, next) => {
    req.body.currencyType = 'coin';
    return currencyController.addCurrency(req, res, next);
  }
);

router.post('/deductCoin',
  authMiddleware,
  async (req, res, next) => {
    req.body.currencyType = 'coin';
    return currencyController.deductCurrency(req, res, next);
  }
);
```

### 4.5 用户服务层修改

**文件位置**：`services/userService.js`（修改）

**修改 `getUserGameInfo` 方法**：

```javascript
async function getUserGameInfo(openid) {
  let userData = await cloudbaseDB.findUserByOpenID(openid);
  
  if (!userData) {
    const now = new Date();
    userData = await cloudbaseDB.createUser({
      openID: openid,
      coin: 0,  // 新用户默认金币为 0
      createdAt: now,
      updatedAt: now
    });
  }
  // 注意：不需要在这里初始化老用户的 coin 字段，懒加载策略在实际操作时处理
  
  // ... 其余逻辑保持不变
  return {
    data: userData,
    isNewRecord
  };
}
```

**说明**：`getUserGameInfo` 返回的数据中，如果老用户的 `coin` 字段不存在，前端应将其视为 0。实际初始化会在首次货币操作时自动完成。

---

## 五、前端接口设计

### 5.1 接口列表

#### 5.1.1 增加货币（通用接口）

**接口地址**：`POST /api/minigame/addCurrency`

**请求头**：
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "currencyType": "coin",
  "amount": 100,
  "source": "level_reward",
  "metadata": {
    "levelId": 1,
    "isFirstClear": true
  }
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "coin": 150,
    "added": 100,
    "source": "level_reward",
    "metadata": {
      "levelId": 1,
      "isFirstClear": true
    }
  },
  "msg": "Add currency success"
}
```

#### 5.1.2 扣除货币（通用接口）

**接口地址**：`POST /api/minigame/deductCurrency`

**请求头**：
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "currencyType": "coin",
  "amount": 50,
  "reason": "refresh_reward"
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "coin": 100,
    "deducted": 50,
    "reason": "refresh_reward"
  },
  "msg": "Deduct currency success"
}
```

**错误响应**（货币不足）：
```json
{
  "code": -1,
  "msg": "Insufficient coin"
}
```

#### 5.1.3 便捷接口（向后兼容）

**接口地址**：
- `POST /api/minigame/addCoin` - 增加金币（内部转换为 `addCurrency`，`currencyType` 固定为 `coin`）
- `POST /api/minigame/deductCoin` - 扣除金币（内部转换为 `deductCurrency`，`currencyType` 固定为 `coin`）

**请求体**（与通用接口相同，但不需要 `currencyType` 字段）：
```json
{
  "amount": 100,
  "source": "level_reward"
}
```

#### 5.1.3 获取用户信息（包含货币）

**接口地址**：`POST /api/minigame/getUserGameInfoV2`

**说明**：此接口已存在，返回的用户信息中包含所有货币字段（`coin`、`diamond` 等，在文档顶层）。**不需要单独的查询货币接口**，通过此接口即可获取用户的所有货币信息。

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "_id": "073a77ac681a0c320284cee70fe9ff04",
    "openID": "ox0H160OiHbng6giS50wOp6YZ7R4",
    "progressLevelID": 2,
    "nickName": "Indey",
    "avatarUrl": "https://...",
    "coin": 150,
    "createdAt": "2025-05-06T13:18:42.514Z",
    "updatedAt": "2025-05-06T13:50:00.139Z"
  },
  "msg": "get user game info success"
}
```

**注意**：`getUserGameInfoV2` 接口返回的数据结构中，所有字段（包括 `coin`）都在文档顶层，不再有 `userGameInfo` 嵌套对象。

### 5.2 货币类型枚举（CurrencyType）

**建议定义**：

| CurrencyType 值 | 说明 | 使用场景 |
|----------------|------|----------|
| `coin` | 金币 | 主要货币，通过推关、签到等获得 |
| `diamond` | 钻石 | 未来扩展的高级货币 |

### 5.3 货币来源枚举（Source）

**建议定义**：

| Source 值 | 说明 | 使用场景 |
|----------|------|----------|
| `daily_checkin` | 每日签到 | 用户每日签到奖励 |
| `level_reward` | 推关奖励 | 通关关卡基础奖励 |
| `first_clear` | 首次通关 | 首次通关某关卡奖励 |
| `star_reward` | 星级奖励 | 根据通关星级给予额外奖励 |
| `daily_task` | 每日任务 | 完成每日任务奖励 |
| `achievement` | 成就奖励 | 达成成就奖励 |

---

## 六、前端数据刷新机制

### 6.1 数据同步策略

#### 6.1.1 主动刷新

**场景**：用户执行金币相关操作后，主动调用接口刷新金币数据。

**实现方式**：

1. **操作后刷新**：
   - 增加货币后：使用接口返回的货币数量直接更新本地数据
   - 扣除货币后：使用接口返回的货币数量直接更新本地数据

2. **关键节点刷新**：
   - 游戏启动时：调用 `getUserGameInfoV2` 获取最新用户数据（包含所有货币）
   - 进入主界面时：调用 `getUserGameInfoV2` 刷新货币显示
   - 返回主界面时：调用 `getUserGameInfoV2` 刷新货币显示

#### 6.1.2 被动更新

**场景**：后端接口返回的数据中包含最新的金币数量，前端直接使用返回数据更新本地状态。

**实现方式**：

1. **接口返回更新**：
   - `addCurrency` 接口返回 `data[currencyType]`，直接更新本地货币
   - `deductCurrency` 接口返回 `data[currencyType]`，直接更新本地货币
   - `getUserGameInfoV2` 接口返回 `data.coin`、`data.diamond` 等，更新所有货币

2. **避免重复请求**：
   - 如果操作接口已经返回最新金币数量，无需再次调用查询接口

### 6.2 前端实现建议

#### 6.2.1 数据模型

**建议在客户端维护一个金币管理器（CoinManager）**：

```csharp
// C# 示例（Unity）
public class CoinManager : Singleton<CoinManager>
{
    private int currentCoin = 0;
    
    // 获取当前金币
    public int GetCoin() => currentCoin;
    
    // 更新金币（从服务器数据同步）
    public void UpdateCoin(int coin)
    {
        currentCoin = coin;
        // 触发UI更新事件
        GameEvent.Send(SlimeEvent.OnCoinChanged, coin);
    }
    
    // 增加金币（本地显示，实际以服务器为准）
    public void AddCoinLocal(int amount)
    {
        currentCoin += amount;
        GameEvent.Send(SlimeEvent.OnCoinChanged, currentCoin);
    }
    
    // 扣除金币（本地显示，实际以服务器为准）
    public void DeductCoinLocal(int amount)
    {
        currentCoin = Math.Max(0, currentCoin - amount);
        GameEvent.Send(SlimeEvent.OnCoinChanged, currentCoin);
    }
}
```

#### 6.2.2 网络请求封装

**建议封装统一的网络请求方法**：

```csharp
// 增加金币
public async UniTask<AddCoinResponse> AddCoin(int amount, string source, Dictionary<string, object> metadata = null)
{
    var request = new AddCoinRequest
    {
        amount = amount,
        source = source,
        metadata = metadata
    };
    
    var response = await NetManager.Instance.Post<AddCoinResponse>("/api/minigame/addCoin", request);
    
    // 更新本地金币
    if (response.code == 0)
    {
        CoinManager.Instance.UpdateCoin(response.data.coin);
    }
    
    return response;
}

// 扣除金币
public async UniTask<DeductCoinResponse> DeductCoin(int amount, string reason)
{
    var request = new DeductCoinRequest
    {
        amount = amount,
        reason = reason
    };
    
    var response = await NetManager.Instance.Post<DeductCoinResponse>("/api/minigame/deductCoin", request);
    
    // 更新本地金币
    if (response.code == 0)
    {
        CoinManager.Instance.UpdateCoin(response.data.coin);
    }
    
    return response;
}

// 注意：不需要单独的查询货币接口，通过 getUserGameInfoV2 获取
```

#### 6.2.3 刷新时机

**建议在以下时机刷新金币数据**：

1. **游戏启动时**：
   ```csharp
   // 在初始化流程中
   var userInfo = await NetManager.Instance.GetUserGameInfo();
   CoinManager.Instance.UpdateCoin(userInfo.coin);
   ```

2. **推关胜利后**：
   ```csharp
   // 在关卡结算界面
   var addCoinResponse = await NetManager.Instance.AddCoin(rewardAmount, "level_reward", metadata);
   // 金币已在 AddCoin 方法中更新，无需额外刷新
   ```

3. **每日签到时**：
   ```csharp
   // 在签到界面
   var addCoinResponse = await NetManager.Instance.AddCoin(checkInReward, "daily_checkin");
   // 金币已在 AddCoin 方法中更新
   ```

4. **返回主界面时**：
   ```csharp
   // 在场景切换时
   var userInfo = await NetManager.Instance.GetUserGameInfo();
   CoinManager.Instance.UpdateCoin(userInfo.coin);
   ```

### 6.3 错误处理

#### 6.3.1 网络错误

**处理策略**：
- 网络请求失败时，保持本地金币数据不变
- 显示错误提示，但不更新UI
- 下次成功请求时自动同步

#### 6.3.2 金币不足

**处理策略**：
- 扣除金币时，如果返回"金币不足"错误，回滚本地金币显示
- 显示提示信息："金币不足，无法完成操作"
- 引导用户通过推关或签到获取金币

#### 6.3.3 数据不一致

**处理策略**：
- 定期（如每次进入主界面）调用 `getUserGameInfoV2` 接口同步服务器数据
- 如果发现本地数据与服务器不一致，以服务器数据为准

---

## 七、实施步骤

### 7.1 第一阶段：数据库和基础服务

1. ✅ 确认数据库字段设计（支持扩展多种货币类型）
2. ✅ 在 `utils/cloudbaseDB.js` 中添加 `incrementCurrency`、`decrementCurrency` 原子操作方法
3. ✅ 创建 `services/currencyService.js`（通用货币服务）
4. ✅ 实现 `addCurrency`、`deductCurrency` 通用方法
5. ✅ 实现 `addCoin`、`deductCoin` 便捷方法（向后兼容）

### 7.2 第二阶段：API接口

1. ✅ 创建 `controllers/currencyController.js`
2. ✅ 实现 `addCurrency`、`deductCurrency` 控制器方法
3. ✅ 在 `routes/minigame.js` 中添加通用路由和便捷路由
4. ✅ 测试接口功能（包括原子操作和并发测试）

### 7.3 第三阶段：前端集成

1. ⏳ 前端创建 `CurrencyManager` 管理器（支持多种货币）
2. ⏳ 封装网络请求方法（使用通用接口）
3. ⏳ 在关键节点添加数据刷新逻辑（通过 `getUserGameInfoV2`）
4. ⏳ 实现UI显示（暂不实现，按需求）

### 7.4 第四阶段：测试和优化

1. ⏳ 单元测试：测试服务层方法和原子操作
2. ⏳ 集成测试：测试API接口
3. ⏳ 懒加载验证：测试老用户首次使用货币功能
4. ⏳ 并发测试：高并发场景下的货币操作（验证原子操作）
5. ⏳ 扩展性测试：测试添加新货币类型（如 diamond）

---

## 八、注意事项

### 8.1 数据安全

1. **服务端验证**：所有货币增减操作必须在服务端验证，客户端只能发起请求
2. **参数校验**：严格校验货币数量、类型、来源等参数，防止异常数据
3. **并发控制**：使用数据库原子操作（`inc`/`dec`），保证并发安全，无需额外的事务或锁
4. **用户身份验证**：所有操作都通过 `authMiddleware` 验证，确保只能操作自己的货币

### 8.2 性能优化

1. **批量操作**：如果未来需要批量操作金币，考虑批量更新接口
2. **缓存策略**：可以考虑在服务端缓存用户金币数据（Redis），但需要与数据库保持一致性
3. **索引优化**：如果金币排行榜查询频繁，添加索引提升性能

### 8.3 日志和监控

1. **操作日志**：记录所有金币变化操作，包括操作人、数量、来源、时间等
2. **异常监控**：监控金币异常变化（如负数、异常增长等）
3. **统计分析**：统计金币获取来源分布，为游戏平衡提供数据支持

### 8.4 扩展性

1. **多货币支持**：✅ 已实现通用货币服务，支持未来添加新货币类型（如钻石、积分等），只需：
   - 在数据库文档中添加新字段（如 `diamond`）
   - 在 `CURRENCY_TYPES` 枚举中添加新类型
   - 使用 `addCurrency`/`deductCurrency` 通用接口即可
2. **奖励配置化**：将货币奖励配置化（如关卡奖励、签到奖励），便于调整
3. **活动支持**：预留活动系统的接口，支持限时活动中的货币奖励

---

## 九、测试用例

### 9.1 单元测试

#### 9.1.1 增加货币测试

```javascript
// 测试正常增加货币（使用通用接口）
test('should add currency successfully', async () => {
  const result = await currencyService.addCurrency('test_openid', 'coin', 100, 'test_source');
  expect(result.coin).toBeGreaterThanOrEqual(100);
  expect(result.added).toBe(100);
});

// 测试原子操作（并发安全）
test('should handle concurrent additions correctly', async () => {
  const promises = Array(10).fill(null).map(() => 
    currencyService.addCurrency('test_openid', 'coin', 10, 'test_source')
  );
  await Promise.all(promises);
  const userData = await cloudbaseDB.findUserByOpenID('test_openid');
  expect(userData.coin).toBe(100); // 应该是 10 * 10 = 100
});

// 测试负数或零金额
test('should throw error for invalid amount', async () => {
  await expect(currencyService.addCurrency('test_openid', 'coin', -10, 'test_source'))
    .rejects.toThrow('Currency amount must be greater than 0');
});
```

#### 9.1.2 扣除货币测试

```javascript
// 测试正常扣除货币
test('should deduct currency successfully', async () => {
  // 先增加货币
  await currencyService.addCurrency('test_openid', 'coin', 100, 'test_source');
  // 再扣除货币
  const result = await currencyService.deductCurrency('test_openid', 'coin', 50, 'test_reason');
  expect(result.coin).toBe(50);
});

// 测试货币不足
test('should throw error for insufficient currency', async () => {
  await expect(currencyService.deductCurrency('test_openid', 'coin', 1000, 'test_reason'))
    .rejects.toThrow('Insufficient coin');
});

// 测试懒加载初始化
test('should initialize currency field on first operation', async () => {
  // 老用户，coin 字段不存在
  const userData = await cloudbaseDB.findUserByOpenID('test_openid');
  expect(userData.coin).toBeUndefined();
  
  // 首次增加货币，应该自动初始化
  await currencyService.addCurrency('test_openid', 'coin', 50, 'test_source');
  const updatedUser = await cloudbaseDB.findUserByOpenID('test_openid');
  expect(updatedUser.coin).toBe(50);
});
```

### 9.2 集成测试

#### 9.2.1 API测试

```bash
# 测试增加货币接口（通用接口）
curl -X POST http://localhost:3000/api/minigame/addCurrency \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"currencyType": "coin", "amount": 100, "source": "test_source"}'

# 测试扣除货币接口（通用接口）
curl -X POST http://localhost:3000/api/minigame/deductCurrency \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"currencyType": "coin", "amount": 50, "reason": "test_reason"}'

# 测试便捷接口（向后兼容）
curl -X POST http://localhost:3000/api/minigame/addCoin \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "source": "test_source"}'

# 获取用户信息（包含所有货币）
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 十、总结

本文档提供了货币系统的完整实现方案，包括：

1. **数据库设计**：在文档顶层存储货币数据（`coin`、`diamond` 等），支持扩展
2. **老用户兼容**：采用懒加载策略，在使用时自动初始化，无需批量迁移
3. **后端服务**：使用数据库原子操作（`inc`/`dec`），提供通用的增加、扣除货币方法
4. **API接口**：提供通用货币接口和便捷接口（向后兼容）
5. **前端同步**：通过 `getUserGameInfoV2` 获取所有货币信息，无需单独查询接口
6. **扩展性**：通用架构设计，支持未来添加新货币类型（如钻石、积分等）

**核心优势**：
- ✅ 使用数据库原子操作，保证并发安全
- ✅ 懒加载策略，无需批量迁移老数据
- ✅ 通用设计，易于扩展新货币类型
- ✅ 简化接口，减少不必要的查询操作
- ✅ 所有操作都针对用户本人，保证安全性

按照本文档实施，可以快速实现货币系统的基础功能，并为后续扩展（如签到、推关奖励、多种货币等）打下基础。

---

## 附录：相关文件清单

### 需要创建的文件

1. `services/currencyService.js` - 通用货币服务层
2. `controllers/currencyController.js` - 货币控制器层

### 需要修改的文件

1. `utils/cloudbaseDB.js` - 添加 `incrementCurrency`、`decrementCurrency` 原子操作方法
2. `routes/minigame.js` - 添加货币相关路由（通用接口和便捷接口）
3. `config/constants.js` - 添加货币类型枚举和来源枚举

### 相关文档

1. `docs/ARCHITECTURE_GUIDE.md` - 架构指南
2. `docs/TEST_API.md` - API测试文档
3. `TEngine/UnityProject/Docs/金币与体力系统需求设计.md` - 需求设计文档

