# 环境变量配置步骤

## 📋 配置信息说明

请从腾讯云控制台获取以下配置信息：

- **环境ID**: 从云开发控制台获取（格式如：`your-env-id`）
- **SecretId**: 从腾讯云访问管理控制台获取
- **SecretKey**: 从腾讯云访问管理控制台获取（⚠️ 请妥善保管，不要泄露）

## 🔧 配置方式

### 方式一：本地开发环境（.env 文件）

在项目根目录创建 `.env` 文件，内容如下：

```bash
# CloudBase 云开发环境配置
TCB_ENV=your-env-id
TCB_SECRET_ID=your-secret-id
TCB_SECRET_KEY=your-secret-key

# 微信小程序配置（必需）
WX_APPID=your-wechat-appid
WX_SECRET=your-wechat-secret

# 认证系统配置（必需）
TOKEN_SECRET=your-secret-key-change-in-production  # 生产环境必须修改为强随机字符串

# 测试模式配置（可选，仅开发环境使用）
ENABLE_TEST_MODE=false          # 是否启用测试模式（测试环境设为true）
TEST_OPENID=editor_test_user    # 默认测试openid（可选，不设置则自动生成）

# 注意：系统仅支持token认证，测试环境使用platform="Editor"获取token
```

**注意**：`.env` 文件已在 `.gitignore` 中，不会被提交到代码仓库。

### 方式二：云托管环境变量配置（生产环境）

1. 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 选择您的服务（cloudrun-express-slime）
3. 进入"环境变量"或"配置"页面
4. 添加以下环境变量：

| 变量名 | 变量值 | 说明 |
|--------|--------|------|
| `TCB_ENV` | `your-env-id` | 云开发环境ID |
| `TCB_SECRET_ID` | `your-secret-id` | 腾讯云SecretId |
| `TCB_SECRET_KEY` | `your-secret-key` | 腾讯云SecretKey |
| `WX_APPID` | `your-wechat-appid` | 微信小程序AppID |
| `WX_SECRET` | `your-wechat-secret` | 微信小程序Secret |
| `TOKEN_SECRET` | `your-secret-key` | Token签名密钥（生产环境必须修改） |
| `ENABLE_TEST_MODE` | `false` | 是否启用测试模式（开发环境可设为true） |
| `TEST_OPENID` | - | 默认测试openid（可选，不设置则自动生成） |

5. 保存配置后，**重新部署服务**使环境变量生效

## ✅ 验证配置

### 本地测试

1. 创建 `.env` 文件（如上所示）
2. 启动服务：
   ```bash
   npm start
   ```
3. 测试接口：
   ```bash
   # 方式1：使用Editor平台测试模式（推荐，需要ENABLE_TEST_MODE=true）
   # 1. 获取测试token
   curl -X POST http://localhost:3000/api/minigame/getCode2Session \
     -H "Content-Type: application/json" \
     -d '{"platform": "Editor", "code": "any_code"}'
   
   # 2. 使用返回的token访问API
   curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d "{}"
   
   # 方式2：使用真实微信code（生产环境）
   # 1. 获取token（需要真实的微信code）
   curl -X POST http://localhost:3000/api/minigame/getCode2Session \
     -H "Content-Type: application/json" \
     -d '{"platform": "wechat", "code": "wx_code_from_miniprogram"}'
   
   # 2. 使用返回的token访问API
   curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d "{}"
   ```

### 云托管测试

1. 配置环境变量后，重新部署服务
2. 查看服务日志，确认没有数据库连接错误
3. 调用接口测试：
   ```bash
   # 替换为您的云托管域名
   # 注意：生产环境应使用真实的token，不要使用测试模式
   curl -X POST https://your-domain/api/minigame/getUserGameInfoV2 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -d "{}"
   ```

## 🔒 安全提示

1. **不要将 `.env` 文件提交到代码仓库**（已在 .gitignore 中）
2. **生产环境使用云托管环境变量**，不要硬编码密钥
3. **定期轮换密钥**，提高安全性
4. **限制密钥权限**，只授予必要的云开发访问权限
5. **生产环境必须修改TOKEN_SECRET**：使用强随机字符串（至少32字符）
6. **生产环境禁用测试模式**：设置 `ENABLE_TEST_MODE=false`
7. **使用HTTPS传输**：确保token在传输过程中的安全性

## 📚 认证系统说明

详细的认证系统使用说明请参考：[认证系统使用指南](./AUTH_GUIDE.md)

## 📊 数据库集合检查

确保以下集合在云开发环境中已创建：

- ✅ `UserGameInfos` - 用户游戏信息集合
- ✅ `Levels` - 关卡配置集合

如果集合不存在，可以在 [云开发控制台](https://console.cloud.tencent.com/tcb/database) 中创建。

## ❓ 常见问题

**Q: 配置后仍然连接失败？**  
A: 检查环境变量名称是否正确，确保没有多余的空格或换行符。

**Q: 本地测试正常，云托管失败？**  
A: 确保在云托管控制台中正确配置了环境变量，并重新部署了服务。

**Q: 如何查看连接日志？**  
A: 在云托管控制台的"日志"页面查看，数据库操作错误会记录在日志中。

**Q: 可以使用服务角色代替密钥吗？**  
A: 可以，如果配置了服务角色，可以不配置 `TCB_SECRET_ID` 和 `TCB_SECRET_KEY`。

