# CloudBase 数据库配置指南

本文档说明如何配置 CloudBase 文档型数据库连接。

## 📋 环境变量配置

### 必需的环境变量

#### 1. 云开发环境ID（EnvId）
```bash
TCB_ENV=your-env-id
# 或
ENV_ID=your-env-id
```

**获取方式：**
- 登录 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
- 在环境列表中查看环境ID

### 可选的环境变量（认证方式）

#### 方式一：使用服务角色（推荐，云托管环境）

如果您的云托管服务已配置服务角色，**不需要**配置以下密钥，SDK会自动使用服务角色进行认证。

#### 方式二：使用密钥认证

如果未配置服务角色，需要配置以下密钥：

```bash
TCB_SECRET_ID=your-secret-id
TCB_SECRET_KEY=your-secret-key
```

**获取方式：**
- 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
- 进入 [访问管理](https://console.cloud.tencent.com/cam/capi) -> API密钥管理
- 创建或查看密钥

### 微信小程序配置（可选）

```bash
WX_APPID=your-wechat-appid
WX_SECRET=your-wechat-secret
```

## 🔧 配置方式

### 方式一：云托管环境变量配置

1. 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 选择您的服务
3. 进入"环境变量"配置页面
4. 添加上述环境变量

### 方式二：本地开发环境配置

创建 `.env` 文件（已支持 dotenv）：

```bash
# .env
TCB_ENV=your-env-id
TCB_SECRET_ID=your-secret-id  # 如果使用密钥认证
TCB_SECRET_KEY=your-secret-key  # 如果使用密钥认证
WX_APPID=your-wechat-appid
WX_SECRET=your-wechat-secret
```

## 📊 数据库集合

项目使用以下数据库集合：

- **UserGameInfos**: 用户游戏信息集合
- **Levels**: 关卡配置集合

确保这些集合在您的云开发环境中已创建。

## ✅ 验证配置

配置完成后，可以通过以下方式验证：

1. **检查环境变量**
   ```bash
   # 在云托管服务中查看日志，确认环境变量已加载
   ```

2. **测试接口**
   ```bash
   # 调用任意接口，查看是否返回数据库数据而非空数据
   POST /api/minigame/getUserGameInfoV2
   ```

## 🔒 安全建议

1. **生产环境**：使用云托管环境变量配置，不要将密钥提交到代码仓库
2. **服务角色**：优先使用服务角色认证，避免密钥泄露风险
3. **权限控制**：确保数据库集合的安全规则已正确配置

## ❓ 常见问题

**Q: 如何知道是否配置了服务角色？**  
A: 在云托管服务配置中查看"访问凭证"部分，如果显示"使用服务角色"，则已配置。

**Q: 使用密钥认证还是服务角色？**  
A: 云托管环境推荐使用服务角色，更安全且无需管理密钥。

**Q: 环境变量配置后不生效？**  
A: 确保环境变量名称正确，并重启服务使配置生效。

**Q: 如何查看数据库连接日志？**  
A: 在云托管控制台的"日志"页面查看，数据库操作错误会记录在日志中。

