# 日志系统使用指南

## 📋 系统概述

本项目使用 **Winston** + **winston-daily-rotate-file** + **Morgan** 构建了一套专业的日志系统。

### 主要特性
- ✅ 自动记录所有 HTTP 请求和响应详情
- ✅ 支持业务日志记录（info、warn、error 等级别）
- ✅ 每小时自动切分日志文件
- ✅ 按日期组织日志目录（`/app/logs/YYYY-MM-DD/`）
- ✅ 异步写入，不阻塞主业务
- ✅ 自动压缩旧日志，节省磁盘空间
- ✅ 全局异常捕获和记录

---

## 📁 日志文件结构

```
/app/logs/
├── 2026-01-17/
│   ├── server-2026-01-17-08.log     # 早上 8 点的日志
│   ├── server-2026-01-17-09.log     # 早上 9 点的日志
│   ├── server-2026-01-17-10.log.gz  # 已压缩的旧日志
│   └── ...
├── 2026-01-18/
│   └── ...
└── ...
```

---

## 🎯 Unity 开发者常用场景

### 1. 记录用户操作日志

```javascript
const { logger } = require('../utils/logger');

// 用户登录成功
logger.info('User login success', {
  userId: 12345,
  username: 'player_001',
  platform: 'iOS'
});

// 用户购买道具
logger.info('Item purchased', {
  userId: 12345,
  itemId: 'sword_legendary',
  price: 999,
  currency: 'gems'
});
```

**日志输出：**
```
2026-01-17 14:35:22.456 [INFO]: User login success {"userId":12345,"username":"player_001","platform":"iOS"}
```

---

### 2. 记录警告信息

```javascript
// 配置项缺失
logger.warn('Config missing, using default value', {
  configKey: 'MAX_PLAYER_COUNT',
  defaultValue: 100
});

// Redis 连接失败，降级到内存缓存
logger.warn('Redis connection failed, fallback to memory cache', {
  error: err.message,
  retryCount: 3
});
```

---

### 3. 记录错误日志（最重要！）

```javascript
// 数据库操作失败
try {
  await db.collection('users').add({ name: 'test' });
} catch (err) {
  logger.error('Database insert failed', {
    collection: 'users',
    error: err.message,
    stack: err.stack,
    userId: req.userId
  });
}

// API 调用失败
logger.error('Third-party API call failed', {
  api: 'payment-gateway',
  endpoint: '/api/charge',
  statusCode: 500,
  error: err.message
});
```

**日志输出：**
```
2026-01-17 14:35:22.789 [ERROR]: Database insert failed {"collection":"users","error":"Connection timeout","stack":"Error: Connection timeout\n    at ...","userId":12345}
```

---

### 4. 调试日志（仅开发环境）

```javascript
// 计算过程日志
logger.debug('Damage calculation', {
  baseDamage: 100,
  criticalRate: 0.25,
  finalDamage: 125
});

// 生产环境不会记录 debug 级别日志
```

---

## 🔍 HTTP 请求日志（自动记录）

系统已在 `app.js` 中配置，**无需手动调用**，会自动记录。

### 日志格式：
每个 HTTP 请求会生成 **2 条独立的日志**：

#### 1️⃣ HTTP Request（请求日志）
记录请求开始时的信息：
- HTTP 方法（GET、POST 等）
- 请求 URL（包含查询参数）
- 客户端 IP 地址
- User-Agent
- 查询参数（query）
- 请求体（body）
- 关键请求头（headers）

#### 2️⃣ HTTP Response（响应日志）
记录响应结束时的信息：
- HTTP 方法
- 请求 URL
- 响应状态码
- 响应时间
- **完整的响应数据**（包含所有字段）

### 日志示例：

#### GET 请求（带查询参数）
```
2026-01-17 13:14:19 [HTTP]: HTTP Request {"method":"GET","url":"/api/test/simple?userId=123&level=10","ip":"::1","userAgent":"Mozilla/5.0...","query":{"userId":"123","level":"10"},"body":{},"headers":{}}

2026-01-17 13:14:19 [HTTP]: HTTP Response {"method":"GET","url":"/api/test/simple?userId=123&level=10","status":200,"responseTime":"0ms","response":{"code":0,"message":"success","data":{"result":"simple test"}}}
```

#### POST 请求（带请求体）
```
2026-01-17 13:13:59 [HTTP]: HTTP Request {"method":"POST","url":"/api/test/complex","ip":"::1","userAgent":"Mozilla/5.0...","query":{},"body":{"userId":123,"action":"purchase"},"headers":{"content-type":"application/json"}}

2026-01-17 13:13:59 [HTTP]: HTTP Response {"method":"POST","url":"/api/test/complex","status":200,"responseTime":"0ms","response":{"code":0,"message":"success","data":{"userId":12345,"username":"test_player","items":[{"id":1,"name":"sword","price":999},{"id":2,"name":"shield","price":500}],"stats":{"level":10,"exp":5000,"gold":10000}}}}
```

### 优势：
- ✅ **请求和响应分离**：便于追踪请求流程
- ✅ **完整响应数据**：不再是概要，而是完整的响应内容
- ✅ **便于调试**：可以清楚看到请求参数和响应结果
- ✅ **便于排查**：通过 URL 和时间戳关联请求和响应

---

## 🛡️ 全局异常处理（自动捕获）

系统已配置全局异常处理，会自动捕获：

1. **未捕获的 Promise 异常**
   ```javascript
   // 即使你忘记 try-catch，也会被记录
   async function riskyOperation() {
     throw new Error('Unexpected error');
   }
   ```

2. **未捕获的同步异常**
   ```javascript
   // 同步代码的异常也会被捕获
   JSON.parse('invalid json');
   ```

3. **路由处理中的异常**
   - 所有路由中抛出的异常都会被 `errorHandler` 中间件捕获并记录

---

## 📊 日志级别说明

| 级别  | 用途 | 示例场景 |
|------|------|---------|
| **error** | 严重错误，需立即关注 | 数据库连接失败、支付异常、崩溃 |
| **warn**  | 警告信息，可能影响功能 | 配置缺失、API 降级、重试 |
| **info**  | 一般信息，业务流程 | 用户登录、订单创建、任务完成 |
| **http**  | HTTP 请求日志 | 自动记录所有 HTTP 请求 |
| **debug** | 调试信息（仅开发环境） | 变量值、中间计算结果 |

---

## 🚀 快速开始

### 在控制器中使用

```javascript
// controllers/minigameController.js
const { logger } = require('../utils/logger');

async function submitScore(req, res) {
  try {
    const { userId, score } = req.body;
    
    // 记录业务日志
    logger.info('Score submitted', { userId, score });
    
    // 业务逻辑...
    const result = await gameService.saveScore(userId, score);
    
    return res.json({ code: 0, data: result });
    
  } catch (err) {
    // 记录错误日志
    logger.error('Submit score failed', {
      error: err.message,
      stack: err.stack,
      userId: req.body.userId
    });
    
    return res.json({ code: -1, message: 'Internal error' });
  }
}
```

### 在服务层使用

```javascript
// services/gameService.js
const { logger } = require('../utils/logger');

class GameService {
  async saveScore(userId, score) {
    logger.info('Saving score to database', { userId, score });
    
    try {
      const result = await db.collection('scores').add({
        userId,
        score,
        timestamp: Date.now()
      });
      
      logger.info('Score saved successfully', { userId, recordId: result.id });
      return result;
      
    } catch (err) {
      logger.error('Failed to save score', {
        userId,
        score,
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  }
}
```

---

## ⚙️ 配置说明

所有配置在 `utils/logger.js` 中：

| 配置项 | 当前值 | 说明 |
|--------|--------|------|
| `LOG_ROOT_DIR` | `/app/logs` | 日志根目录 |
| `datePattern` | `YYYY-MM-DD/[server-]YYYY-MM-DD-HH` | 按日期分目录，每小时切分文件 |
| `maxSize` | `20m` | 单文件最大 20MB |
| `maxFiles` | `30d` | 保留 30 天 |
| `zippedArchive` | `true` | 自动压缩旧日志 |

---

## 📝 注意事项

1. **避免记录敏感信息**
   ```javascript
   // ❌ 不要记录密码、token 等敏感信息
   logger.info('User login', { password: '123456' }); // 危险！
   
   // ✅ 正确做法
   logger.info('User login', { userId: 123 });
   ```

2. **避免记录过大的对象**
   ```javascript
   // ❌ 不要记录整个数据库查询结果
   logger.info('Query result', { data: hugeArray }); // 日志文件会很大
   
   // ✅ 只记录关键信息
   logger.info('Query result', { count: hugeArray.length });
   ```

3. **生产环境日志级别**
   - 建议设置 `NODE_ENV=production` 时只记录 `http` 及以上级别
   - `debug` 日志仅在开发环境启用

---

## 🔧 故障排查

### 日志文件没有生成？

1. 检查日志目录权限
   ```bash
   ls -la /app/logs
   ```

2. 查看控制台是否有 Winston 错误信息

### 日志没有按小时切分？

- 检查 `datePattern` 配置是否为 `YYYY-MM-DD/[server-]YYYY-MM-DD-HH`
- 确认系统时间正确

### 日志文件过大？

- 调整 `maxSize` 参数（当前 20MB）
- 减少 `maxFiles` 保留天数（当前 30 天）
- 检查是否记录了过大的对象

---

## 📚 更多资源

- [Winston 官方文档](https://github.com/winstonjs/winston)
- [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)
- [Morgan 文档](https://github.com/expressjs/morgan)

---

## ✨ 示例代码总结

```javascript
// 引入 logger
const { logger } = require('../utils/logger');

// 业务日志
logger.info('描述信息', { 关键参数对象 });

// 警告日志
logger.warn('警告信息', { 上下文数据 });

// 错误日志（最重要！）
logger.error('错误描述', {
  error: err.message,
  stack: err.stack,
  ...其他上下文
});

// 调试日志（仅开发环境）
logger.debug('调试信息', { 调试数据 });
```

---

**祝开发顺利！🎮**
