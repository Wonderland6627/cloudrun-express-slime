# 环境变量配置步骤

## 📋 您提供的配置信息

- **环境ID**: `slimecloudservice-6enxmrfbc5bddc`
- **SecretId**: `AKID5AtZ7TdbO1Rksrz0wobFhx0Ns23vodRH`
- **SecretKey**: `lQuBG9pV6ZXRN6f3IK1saKzpIlHyY0HE`

## 🔧 配置方式

### 方式一：本地开发环境（.env 文件）

在项目根目录创建 `.env` 文件，内容如下：

```bash
# CloudBase 云开发环境配置
TCB_ENV=slimecloudservice-6enxmrfbc5bddc
TCB_SECRET_ID=AKID5AtZ7TdbO1Rksrz0wobFhx0Ns23vodRH
TCB_SECRET_KEY=lQuBG9pV6ZXRN6f3IK1saKzpIlHyY0HE

# 微信小程序配置（可选）
# WX_APPID=your-wechat-appid
# WX_SECRET=your-wechat-secret
```

**注意**：`.env` 文件已在 `.gitignore` 中，不会被提交到代码仓库。

### 方式二：云托管环境变量配置（生产环境）

1. 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 选择您的服务（cloudrun-express-slime）
3. 进入"环境变量"或"配置"页面
4. 添加以下环境变量：

| 变量名 | 变量值 |
|--------|--------|
| `TCB_ENV` | `slimecloudservice-6enxmrfbc5bddc` |
| `TCB_SECRET_ID` | `AKID5AtZ7TdbO1Rksrz0wobFhx0Ns23vodRH` |
| `TCB_SECRET_KEY` | `lQuBG9pV6ZXRN6f3IK1saKzpIlHyY0HE` |

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
   # 测试获取用户游戏信息（需要提供 openid）
   curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
     -H "Content-Type: application/json" \
     -H "x-openid: test-openid-123" \
     -d "{}"
   ```

### 云托管测试

1. 配置环境变量后，重新部署服务
2. 查看服务日志，确认没有数据库连接错误
3. 调用接口测试：
   ```bash
   # 替换为您的云托管域名
   curl -X POST https://your-domain/api/minigame/getUserGameInfoV2 \
     -H "Content-Type: application/json" \
     -H "x-openid: test-openid-123" \
     -d "{}"
   ```

## 🔒 安全提示

1. **不要将 `.env` 文件提交到代码仓库**（已在 .gitignore 中）
2. **生产环境使用云托管环境变量**，不要硬编码密钥
3. **定期轮换密钥**，提高安全性
4. **限制密钥权限**，只授予必要的云开发访问权限

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

