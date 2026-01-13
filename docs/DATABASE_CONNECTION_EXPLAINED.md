# 数据库连接机制说明

## 🤔 为什么没有配置密钥也能连接数据库？

您可能发现：代码中没有填写数据库ID或密钥，但数据库连接成功了。这是因为**腾讯云托管（CloudRun）**提供了自动化的认证和关联机制。

## 🔍 连接机制详解

### 1. 云托管服务角色认证（推荐方式）

当您的服务部署在**腾讯云托管**时，如果配置了**服务角色**，SDK会自动使用服务角色进行认证，**无需手动配置密钥**。

#### 工作原理：

```javascript
// utils/cloudbaseDB.js 中的代码逻辑
const initConfig = {
  env: process.env.TCB_ENV || process.env.ENV_ID, // 只需要环境ID
};

// 如果提供了密钥，则使用密钥认证
if (process.env.TCB_SECRET_ID && process.env.TCB_SECRET_KEY) {
  initConfig.secretId = process.env.TCB_SECRET_ID;
  initConfig.secretKey = process.env.TCB_SECRET_KEY;
}
// 云托管环境下，如果配置了服务角色，可以不传 secretId 和 secretKey
// SDK会自动从云托管服务角色获取认证信息
```

#### 关键点：

1. **服务角色**：云托管服务创建时，系统会自动创建一个服务角色
2. **自动认证**：SDK检测到在云托管环境运行时，会自动使用服务角色进行认证
3. **无需密钥**：不需要配置 `TCB_SECRET_ID` 和 `TCB_SECRET_KEY`

### 2. 环境关联机制

#### 云托管服务与云开发环境的关联：

- **同一环境**：云托管服务部署在某个云开发环境中时，自动关联该环境下的所有资源
- **数据库访问**：只需要提供环境ID（`TCB_ENV`），就能访问同环境下的数据库
- **自动识别**：SDK会自动识别当前运行环境，连接到正确的数据库

#### 环境ID的获取方式：

1. **环境变量配置**（推荐）：
   ```bash
   TCB_ENV=your-env-id
   # 或
   ENV_ID=your-env-id
   ```

2. **云托管控制台自动注入**：
   - 如果云托管服务配置了环境变量 `TCB_ENV`，会自动注入到运行环境
   - 可以在云托管控制台的"环境变量"页面查看

3. **代码中硬编码**（不推荐）：
   ```javascript
   const initConfig = {
     env: 'your-env-id' // 不推荐，应该使用环境变量
   };
   ```

## 📋 连接方式总结

### 方式一：服务角色认证（云托管环境，推荐）

**适用场景**：服务部署在腾讯云托管

**配置要求**：
- ✅ 只需配置环境ID：`TCB_ENV=your-env-id`
- ❌ 不需要配置密钥：`TCB_SECRET_ID` 和 `TCB_SECRET_KEY`

**优点**：
- 更安全：密钥由云平台管理，不会泄露
- 更简单：无需管理密钥
- 自动更新：服务角色权限自动管理

**如何确认是否使用服务角色**：
1. 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 进入您的服务详情页
3. 查看"访问凭证"或"配置"部分
4. 如果显示"使用服务角色"，则已启用

### 方式二：密钥认证（本地开发或其他环境）

**适用场景**：本地开发、其他云平台部署

**配置要求**：
- ✅ 配置环境ID：`TCB_ENV=your-env-id`
- ✅ 配置密钥：`TCB_SECRET_ID` 和 `TCB_SECRET_KEY`

**获取密钥**：
1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 [访问管理](https://console.cloud.tencent.com/cam/capi) -> API密钥管理
3. 创建或查看密钥

## 🔍 如何查看当前使用的连接方式？

### 方法一：查看云托管控制台

1. 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 进入服务详情页
3. 查看"环境变量"配置：
   - 如果只有 `TCB_ENV`，说明使用**服务角色认证**
   - 如果有 `TCB_SECRET_ID` 和 `TCB_SECRET_KEY`，说明使用**密钥认证**

### 方法二：查看服务日志

在代码中添加日志输出：

```javascript
// utils/cloudbaseDB.js
console.log('Environment ID:', process.env.TCB_ENV || process.env.ENV_ID);
console.log('Has Secret ID:', !!process.env.TCB_SECRET_ID);
console.log('Has Secret Key:', !!process.env.TCB_SECRET_KEY);
console.log('Using Service Role:', !process.env.TCB_SECRET_ID && !process.env.TCB_SECRET_KEY);
```

部署后查看云托管服务日志，可以看到使用的认证方式。

## ❓ 常见问题

### Q1: 为什么我没有配置密钥，但数据库连接成功了？

**A**: 这是因为您的云托管服务配置了**服务角色**，SDK自动使用服务角色进行认证。这是推荐的方式，更安全且无需管理密钥。

### Q2: 服务部署在哪里，就会连接哪里的数据库吗？

**A**: 不完全正确。连接哪个数据库取决于：
1. **环境ID**（`TCB_ENV`）：决定连接到哪个云开发环境
2. **云托管服务所在的环境**：如果服务部署在云开发环境中，会自动关联该环境的数据库
3. **环境变量配置**：如果配置了 `TCB_ENV`，会连接到指定的环境

**关键点**：不是"部署在哪里就连接哪里"，而是"环境ID决定连接哪里"。

### Q3: 如何确保连接到正确的数据库？

**A**: 
1. 确认环境ID正确：在云托管控制台查看 `TCB_ENV` 环境变量
2. 确认数据库集合存在：在云开发控制台确认 `UserGameInfos` 和 `Levels` 集合已创建
3. 测试连接：调用API接口，查看是否返回数据库数据

### Q4: 本地开发时如何连接数据库？

**A**: 本地开发需要配置密钥认证：
1. 创建 `.env` 文件
2. 配置环境变量：
   ```bash
   TCB_ENV=your-env-id
   TCB_SECRET_ID=your-secret-id
   TCB_SECRET_KEY=your-secret-key
   ```
3. 确保项目已安装 `dotenv` 包（已安装）

### Q5: 如何切换数据库环境？

**A**: 修改环境变量 `TCB_ENV` 的值：
1. 在云托管控制台修改环境变量
2. 重新部署服务
3. 服务会自动连接到新的环境数据库

### Q6: 看到警告 `[TCB][WARN] 当前未指定env，将默认使用第一个创建的环境！` 怎么办？

**A**: 这个警告表示**没有配置环境ID**，SDK自动使用了第一个创建的环境。

**问题原因**：
- 环境变量 `TCB_ENV` 或 `ENV_ID` 未配置
- 代码中 `process.env.TCB_ENV` 和 `process.env.ENV_ID` 都是 `undefined`

**解决方案**：

1. **在云托管控制台配置环境变量**（推荐）：
   - 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
   - 进入服务详情页 → "环境变量"或"配置"页面
   - 添加环境变量：
     ```
     变量名: TCB_ENV
     变量值: your-env-id（替换为您的实际环境ID）
     ```
   - 保存后**重新部署服务**

2. **获取环境ID**：
   - 登录 [云开发控制台](https://console.cloud.tencent.com/tcb)
   - 在环境列表中查看环境ID（格式如：`env-xxxxx`）

3. **验证配置**：
   - 重新部署后，查看服务日志
   - 应该看到：`[CloudBase DB] Using env: your-env-id`
   - 不再出现警告信息

**⚠️ 重要提示**：
- 虽然使用默认环境也能正常工作，但**不推荐**在生产环境使用
- 如果您的账号有多个环境，可能连接到错误的环境
- 建议明确配置 `TCB_ENV`，确保连接到正确的环境

## 🔒 安全建议

1. **生产环境**：使用服务角色认证，不要配置密钥
2. **本地开发**：使用 `.env` 文件配置密钥，不要提交到代码仓库
3. **环境隔离**：不同环境（开发/测试/生产）使用不同的环境ID
4. **权限控制**：确保数据库集合的安全规则已正确配置

## 📚 相关文档

- [CloudBase 数据库配置指南](./CLOUDBASE_CONFIG.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)
- [环境变量配置](./ENV_SETUP.md)

