# 环境配置

## 本地开发配置

创建`.env`文件：

```bash
# 云开发配置
TCB_ENV=your-env-id
TCB_SECRET_ID=your-secret-id
TCB_SECRET_KEY=your-secret-key

# 微信配置（必需）
WX_APPID=your-wechat-appid
WX_SECRET=your-wechat-secret

# 认证配置（必需）
TOKEN_SECRET=your-secret-key-change-in-production

# 环境标识
NODE_ENV=development

# 测试模式（仅开发环境）
ENABLE_TEST_MODE=true
TEST_OPENID=editor_test_user
```

**注意**：`.env`文件已在`.gitignore`中，不会被提交。

## 云托管配置

在[腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)配置环境变量：

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `TCB_ENV` | 云开发环境ID | 是 |
| `TCB_SECRET_ID` | 腾讯云SecretId | 是 |
| `TCB_SECRET_KEY` | 腾讯云SecretKey | 是 |
| `WX_APPID` | 微信AppID | 是 |
| `WX_SECRET` | 微信Secret | 是 |
| `TOKEN_SECRET` | JWT密钥 | 是 |
| `NODE_ENV` | 环境标识 | 是 |
| `ENABLE_TEST_MODE` | 测试模式 | 否 |

**重要**：配置后需重新部署服务。

## 验证配置

### 本地验证
```bash
npm start

# 测试接口
curl -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -d '{"platform":"Editor","code":"test"}'
```

### 云托管验证
1. 查看服务日志，确认无数据库连接错误
2. 调用接口测试

## 安全提示

1. **不要提交`.env`文件**到代码仓库
2. **生产环境使用云托管环境变量**，不要硬编码
3. **生产环境必须修改`TOKEN_SECRET`**为强随机字符串
4. **生产环境禁用测试模式**：`ENABLE_TEST_MODE=false`
5. **定期轮换密钥**

## 数据库集合

确保以下集合已创建：
- `UserGameInfos` - 用户游戏信息
- `Levels` - 关卡配置

在[云开发控制台](https://console.cloud.tencent.com/tcb/database)中创建。

## 常见问题

**Q: 配置后仍然连接失败？**  
A: 检查环境变量名称是否正确，确保没有多余空格。

**Q: 本地测试正常，云托管失败？**  
A: 确保云托管控制台中正确配置了环境变量，并重新部署。

**Q: 可以使用服务角色代替密钥吗？**  
A: 可以，如果配置了服务角色，可以不配置`TCB_SECRET_ID`和`TCB_SECRET_KEY`。
