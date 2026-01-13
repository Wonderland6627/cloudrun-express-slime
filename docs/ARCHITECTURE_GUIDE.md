# 标准服务端架构使用文档

## 📁 项目结构

```
project/
├── app.js                 # Express应用入口
├── bin/
│   └── www                # 服务器启动脚本
├── config/                 # 配置层
│   ├── constants.js       # 常量配置（集合名、响应码等）
│   └── database.js        # 数据库配置
├── controllers/           # 控制器层
│   └── minigameController.js  # 小游戏控制器
├── services/              # 服务层（业务逻辑）
│   ├── authService.js     # 认证服务
│   ├── userService.js     # 用户服务
│   └── gameService.js     # 游戏服务
├── middlewares/           # 中间件层
│   ├── auth.js            # 认证中间件
│   ├── errorHandler.js    # 错误处理中间件
│   ├── response.js        # 响应格式化中间件
│   └── validator.js       # 参数验证中间件
├── routes/                 # 路由层
│   ├── index.js           # 首页路由
│   └── minigame.js        # 小游戏路由
├── utils/                  # 工具层
│   ├── cloudbaseDB.js     # 数据库操作（DAO层）
│   ├── platformAuth.js    # 多平台认证工具（微信/抖音/B站）
│   ├── tokenManager.js    # JWT Token管理器
│   └── version.js         # 版本工具
└── views/                  # 视图层（Jade模板）
```

---

## 🏗️ 架构分层说明

### 1. **路由层（Routes）**
**职责**：只负责路由定义和中间件绑定

**位置**：`routes/`

**示例**：
```javascript
const { authMiddleware } = require('../middlewares/auth');
const minigameController = require('../controllers/minigameController');

router.post('/getUserGameInfoV2',
  authMiddleware,  // 认证中间件
  minigameController.getUserGameInfo  // 控制器方法
);
```

**原则**：
- ✅ 只定义路由和中间件
- ❌ 不包含业务逻辑
- ❌ 不包含参数验证（使用中间件）
- ❌ 不包含错误处理（使用统一错误处理）

---

### 2. **控制器层（Controllers）**
**职责**：处理HTTP请求和响应，调用服务层

**位置**：`controllers/`

**示例**：
```javascript
const userService = require('../services/userService');
const { success } = require('../middlewares/response');

async function getUserGameInfo(req, res, next) {
  try {
    const openid = req.user.openid; // 从中间件获取
    const { data, isNewRecord } = await userService.getUserGameInfo(openid);
    
    const msg = isNewRecord 
      ? 'no result found, created empty info' 
      : 'get user game info success';
    
    return success(res, data, msg);
  } catch (err) {
    next(err); // 交给错误处理中间件
  }
}
```

**原则**：
- ✅ 从req获取参数
- ✅ 调用服务层处理业务逻辑
- ✅ 使用响应格式化工具返回结果
- ✅ 错误通过next(err)传递给错误处理中间件
- ❌ 不包含复杂业务逻辑

---

### 3. **服务层（Services）**
**职责**：业务逻辑处理，数据转换和组合

**位置**：`services/`

**示例**：
```javascript
const cloudbaseDB = require('../utils/cloudbaseDB');

async function getUserGameInfo(openid) {
  // 先查询用户是否存在
  let userData = await cloudbaseDB.findUserByOpenID(openid);
  
  // 业务逻辑：如果不存在，创建空记录
  if (!userData) {
    const now = new Date();
    userData = await cloudbaseDB.createUser({
      openID: openid,
      createdAt: now,
      updatedAt: now
    });
  }
  
  // 业务逻辑处理：判断是否是新记录
  const isNewRecord = userData.createdAt && userData.updatedAt && 
                     userData.createdAt.getTime() === userData.updatedAt.getTime();
  
  return {
    data: userData,
    isNewRecord
  };
}
```

**原则**：
- ✅ 包含业务逻辑
- ✅ 数据转换和组合
- ✅ 调用DAO层（utils/cloudbaseDB.js）
- ❌ 不直接操作HTTP请求/响应
- ❌ 不包含数据库连接逻辑

---

### 4. **中间件层（Middlewares）**
**职责**：横切关注点（认证、验证、错误处理、响应格式化）

**位置**：`middlewares/`

#### 4.1 认证中间件（auth.js）
```javascript
const { authMiddleware } = require('../middlewares/auth');

router.post('/api/user', authMiddleware, controller.method);
```

#### 4.2 参数验证中间件（validator.js）
```javascript
const { validateCode } = require('../middlewares/validator');

router.post('/api/login', validateCode, controller.method);
```

#### 4.3 响应格式化（response.js）
```javascript
const { success, error } = require('../middlewares/response');

// 在控制器中使用
return success(res, data, 'success message');
return error(res, 'error message', -1);
```

#### 4.4 错误处理（errorHandler.js）
```javascript
// 在app.js中注册（必须在所有路由之后）
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);
```

---

### 5. **工具层（Utils/DAO层）**
**职责**：数据库操作、第三方API调用、通用工具函数

**位置**：`utils/`

**示例**：
```javascript
// utils/cloudbaseDB.js - 数据库操作（DAO层）
async function findUserByOpenID(openID) {
  const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
  const result = await collection.where({ openID: openID }).get();
  return result.data && result.data.length > 0 ? result.data[0] : null;
}

async function createUser(userData) {
  const collection = db.collection(COLLECTIONS.USER_GAME_INFOS);
  const addResult = await collection.add(userData);
  return { _id: addResult.id, ...userData };
}
```

**原则**：
- ✅ 只负责数据访问
- ✅ 不包含业务逻辑
- ✅ 可被多个服务复用

---

### 6. **配置层（Config）**
**职责**：统一管理配置和常量

**位置**：`config/`

**示例**：
```javascript
// config/constants.js
module.exports = {
  COLLECTIONS: {
    USER_GAME_INFOS: 'UserGameInfos',
    LEVELS: 'Levels'
  },
  RESPONSE_CODE: {
    SUCCESS: 0,
    ERROR: -1
  }
};
```

---

## 🔄 请求处理流程

```
1. 请求到达
   ↓
2. 路由层（routes/）- 路由匹配
   ↓
3. 中间件层（middlewares/）
   ├── 认证中间件（auth.js）
   ├── 参数验证中间件（validator.js）
   ↓
4. 控制器层（controllers/）- 处理请求/响应
   ↓
5. 服务层（services/）- 业务逻辑处理
   ↓
6. 工具层（utils/）- 数据访问（DAO）
   ↓
7. 返回数据
   ↓
8. 响应格式化中间件（response.js）
   ↓
9. 错误处理中间件（errorHandler.js）- 如有错误
   ↓
10. 响应返回客户端
```

---

## 📝 开发指南

### 添加新接口

#### 步骤1：在服务层添加业务逻辑
```javascript
// services/userService.js
async function getUserProfile(openid) {
  // 业务逻辑
  return profileData;
}
```

#### 步骤2：在控制器层添加处理方法
```javascript
// controllers/userController.js
async function getUserProfile(req, res, next) {
  try {
    const openid = req.user.openid;
    const profile = await userService.getUserProfile(openid);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
}
```

#### 步骤3：在路由层添加路由
```javascript
// routes/user.js
const { authMiddleware } = require('../middlewares/auth');
const userController = require('../controllers/userController');

router.get('/profile',
  authMiddleware,
  userController.getUserProfile
);
```

#### 步骤4：在app.js中注册路由
```javascript
// app.js
const userRouter = require('./routes/user');
app.use('/api/user', userRouter);
```

---

### 添加新中间件

#### 示例：添加日志中间件
```javascript
// middlewares/logger.js
function requestLogger(req, res, next) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
}

module.exports = { requestLogger };
```

**在app.js中使用**：
```javascript
const { requestLogger } = require('./middlewares/logger');
app.use(requestLogger);
```

---

### 统一响应格式

所有接口统一使用以下格式：

**成功响应**：
```json
{
  "code": 0,
  "data": {},
  "msg": "success"
}
```

**错误响应**：
```json
{
  "code": -1,
  "msg": "error message"
}
```

**响应码说明**：
- `0`: 成功
- `-1`: 通用错误
- `-2`: 未授权
- `-3`: 未找到
- `-4`: 参数验证错误

---

### 错误处理

#### 在控制器中抛出错误
```javascript
const { AppError } = require('../middlewares/errorHandler');
const { RESPONSE_CODE } = require('../config/constants');

async function someMethod(req, res, next) {
  try {
    if (!someCondition) {
      throw new AppError('Error message', RESPONSE_CODE.ERROR, 400);
    }
    // ...
  } catch (err) {
    next(err); // 交给错误处理中间件
  }
}
```

#### 自定义错误类
```javascript
// middlewares/errorHandler.js
class AppError extends Error {
  constructor(message, code = -1, statusCode = 200) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isCustom = true;
  }
}
```

---

## 🎯 最佳实践

### 1. **单一职责原则**
- 每个文件只负责一个功能
- 路由只负责路由，控制器只负责请求/响应，服务只负责业务逻辑

### 2. **依赖注入**
- 通过require引入依赖，便于测试和替换

### 3. **错误处理**
- 统一使用错误处理中间件
- 错误信息不暴露敏感信息（生产环境）

### 4. **代码复用**
- 通用逻辑提取为中间件或工具函数
- 避免代码重复

### 5. **配置管理**
- 所有配置统一放在config目录
- 使用环境变量管理敏感信息

### 6. **命名规范**
- 文件使用小写+连字符：`user-service.js`
- 类使用大驼峰：`UserService`
- 函数使用小驼峰：`getUserInfo`

---

## 🔍 调试技巧

### 1. 查看请求日志
中间件会自动记录请求信息，查看控制台输出。

### 2. 错误追踪
错误会被统一记录，包含：
- 错误消息
- 堆栈信息
- 请求URL和方法
- 时间戳

### 3. 测试接口
使用Postman或curl测试接口，确保响应格式统一。

---

## 📚 相关文档

- [架构分析文档](./ARCHITECTURE_ANALYSIS.md) - 详细的架构问题分析
- [API测试文档](./TEST_API.md) - API接口测试指南
- [快速开始](./QUICK_START.md) - 项目快速开始指南

---

## ✅ 检查清单

开发新功能时，请确保：

- [ ] 路由层只包含路由定义和中间件绑定
- [ ] 控制器层只处理请求/响应，不包含业务逻辑
- [ ] 服务层包含所有业务逻辑
- [ ] 使用统一的响应格式化工具
- [ ] 错误通过next(err)传递给错误处理中间件
- [ ] 配置统一放在config目录
- [ ] 代码符合命名规范
- [ ] 添加了必要的注释和文档

---

## 🚀 总结

这个标准架构提供了：

1. **清晰的分层**：路由 → 控制器 → 服务 → DAO
2. **统一的错误处理**：所有错误统一处理
3. **统一的响应格式**：所有接口响应格式一致
4. **易于维护**：职责清晰，易于修改和扩展
5. **易于测试**：每层可以独立测试

遵循这个架构，可以确保代码质量和可维护性。

