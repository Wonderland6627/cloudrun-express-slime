# 腾讯云托管部署指南（当前版本）

## 前置条件

1. 已开通 CloudBase 环境
2. 已创建云托管服务
3. 项目可本地启动：`npm start`
4. 了解当前镜像基于 `node:20-alpine`（见 `Dockerfile`）

---

## 部署前本地验证

```bash
npm install
npm start
```

建议至少验证：

1. `POST /api/minigame/getCode2Session`
2. `POST /api/minigame/getUserGameInfoV2`（带 token）
3. `GET /health`

---

## 云托管环境变量

最小建议配置：

```bash
NODE_ENV=production
ENABLE_TEST_MODE=false
TCB_ENV=your-env-id
TOKEN_SECRET=your-strong-secret
WX_APPID=your-wechat-appid
WX_SECRET=your-wechat-secret
```

如未使用服务角色认证，还需配置：

```bash
TCB_SECRET_ID=your-secret-id
TCB_SECRET_KEY=your-secret-key
```

---

## 部署步骤（控制台）

1. 进入 CloudBase 控制台 -> 云托管 -> 你的服务
2. 新建版本（本地代码包或 Git 仓库）
3. 使用项目根目录 `Dockerfile`
4. 设置环境变量（见上文）
5. 开启公网访问（按业务需要）
6. 部署并等待状态变为“运行中”

---

## 健康检查与端口

- 应用监听 `process.env.PORT`，Docker 默认 `PORT=80`
- 健康检查接口：`GET /health`
- 若出现 Readiness/Liveness 失败，优先检查：
  1. 控制台端口配置
  2. 启动日志是否正常
  3. 是否有必需环境变量缺失

---

## 部署后验证

```bash
# 健康检查
curl https://your-domain/health

# 版本检查
curl https://your-domain/api/version

# 获取 token（生产需真实 wechat code）
curl -X POST https://your-domain/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -d '{"platform":"wechat","code":"REAL_CODE"}'
```

---

## 常见问题

### 1) 首次访问偶发 503

- 常见于最小实例数为 0 导致冷启动
- 可将最小实例数调整为 1（会增加保底成本）

### 2) 连接数据库失败

- 检查 `TCB_ENV` 是否正确
- 确认服务角色权限或 `TCB_SECRET_ID/TCB_SECRET_KEY` 配置

### 3) editor 平台登录失败

- 生产默认关闭测试模式，`editor` 登录不可用
- 仅开发环境启用 `ENABLE_TEST_MODE=true`

---

## 推荐联动文档

- `接口参考-API_REFERENCE.md`
- `认证指南-AUTH_GUIDE.md`
- `环境配置-ENV_SETUP.md`
- `503错误排查-503_TROUBLESHOOTING.md`
