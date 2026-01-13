# 快速修复：添加环境ID配置

## 🔍 当前状态

您已经配置了：
- ✅ `TCB_SECRET_ID`
- ✅ `TCB_SECRET_KEY`
- ❌ `TCB_ENV`（缺失，导致警告）

## 🚀 快速解决步骤

### 第一步：获取您的环境ID

1. 登录 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 在页面顶部或左侧，您会看到当前环境
3. 环境ID显示格式通常为：
   - `env-xxxxx`（如：`env-abc123`）
   - 或者是一个较短的ID（如：`cloud1`）

**查看方式**：
- 方式一：控制台顶部显示的环境名称旁边
- 方式二：点击环境名称，在环境详情页查看
- 方式三：在"环境设置"或"概览"页面查看

### 第二步：在云托管控制台添加环境变量

1. 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 进入您的服务详情页
3. 找到 **"环境变量"** 或 **"配置"** 页面
4. 添加新的环境变量：
   ```
   变量名: TCB_ENV
   变量值: 您的环境ID（例如：env-abc123）
   ```

### 第三步：重新部署服务

添加环境变量后，需要重新部署服务才能生效：

1. 在服务详情页，点击 **"新建版本"** 或 **"重新部署"**
2. 选择相同的代码源（Git仓库或本地代码）
3. 点击 **"部署"**
4. 等待部署完成

### 第四步：验证配置

部署完成后，查看服务日志，您应该看到：

```
[CloudBase DB] Initializing database connection...
[CloudBase DB] TCB_ENV: env-xxxxx（您的环境ID）
[CloudBase DB] ENV_ID: (not set)
[CloudBase DB] Using env: env-xxxxx
[CloudBase DB] Using Secret ID/Key authentication
```

**不再出现警告**：`[TCB][WARN] 当前未指定env...`

## 📋 完整的环境变量配置示例

在云托管控制台的环境变量配置中，应该包含：

```json
{
  "TCB_ENV": "env-xxxxx",
  "TCB_SECRET_ID": "AKID5AtZ7TdbO1Rksrz0wobFhx0Ns23vodRH",
  "TCB_SECRET_KEY": "lQuBG9pV6ZXRN6f3IK1saKzpIlHyY0HE"
}
```

**注意**：
- 如果还有微信相关配置，也需要添加：
  - `WX_APPID`
  - `WX_SECRET`

## ❓ 常见问题

### Q: 如果我有多个环境怎么办？

**A**: 即使您只有一个环境，也应该明确配置 `TCB_ENV`：
- 避免警告日志
- 代码更清晰，便于后续维护
- 如果将来创建新环境，不会误连接

### Q: 环境ID在哪里找？

**A**: 在云开发控制台：
1. 登录后，页面顶部显示当前环境
2. 点击环境名称，查看环境详情
3. 环境ID通常显示在环境名称下方或详情页

### Q: 配置后还是出现警告？

**A**: 检查以下几点：
1. 环境变量名称是否正确：`TCB_ENV`（注意大小写）
2. 环境变量值是否正确：不要有多余的空格
3. 是否重新部署了服务：环境变量修改后必须重新部署
4. 查看日志确认环境变量是否被读取

## 🔒 安全提示

⚠️ **重要**：您当前使用的是密钥认证方式。建议：

1. **生产环境**：考虑使用服务角色认证（更安全）
   - 删除 `TCB_SECRET_ID` 和 `TCB_SECRET_KEY`
   - 只保留 `TCB_ENV`
   - SDK会自动使用服务角色认证

2. **密钥安全**：
   - 不要将密钥提交到代码仓库
   - 定期轮换密钥
   - 使用环境变量管理，不要硬编码

## 📚 相关文档

- [数据库连接机制说明](./DATABASE_CONNECTION_EXPLAINED.md)
- [环境变量配置指南](./ENV_SETUP.md)
- [CloudBase配置指南](./CLOUDBASE_CONFIG.md)

