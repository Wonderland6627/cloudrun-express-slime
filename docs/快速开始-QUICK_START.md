# 快速开始（5 分钟）

## 1. 安装与启动

```bash
npm install
npm start
```

默认地址：`http://localhost:3000`

---

## 2. 开发环境最小配置

创建 `.env`（示例）：

```bash
NODE_ENV=development
ENABLE_TEST_MODE=true
TCB_ENV=your-env-id
TOKEN_SECRET=your-dev-secret
```

如需本地直连 CloudBase（非服务角色），再补充：

```bash
TCB_SECRET_ID=your-secret-id
TCB_SECRET_KEY=your-secret-key
```

---

## 3. 快速联调（Editor 平台）

> 以下命令使用 `editor` 测试模式登录。

```bash
# 1) 获取 token
TOKEN=$(curl -s -X POST http://localhost:3000/api/minigame/getCode2Session \
  -H "Content-Type: application/json" \
  -d '{"platform":"editor","code":"local_test_user"}' | jq -r '.data.token')

# 2) 拉取用户信息（自动建档）
curl -X POST http://localhost:3000/api/minigame/getUserGameInfoV2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"

# 3) 增加 100 金币（resourceType=1）
curl -X POST http://localhost:3000/api/minigame/updateResource \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resourceType":1,"change":100,"source":"debug_add_coin"}'
```

---

## 4. 当前核心接口

所有业务接口前缀：`/api/minigame`

- `POST /getCode2Session`
- `POST /getUserWXContext`
- `POST /getUserGameInfoV2`
- `POST /setUserGameInfoV2`
- `POST /getUserRankListV2`
- `POST /getLevelsConfigV2`
- `POST /updateResource`
- `POST /getResources`
- `POST /claimLevelReward`
- `POST /claimDailyCheckin`
- `POST /claimLevelChest`

---

## 5. 常见问题

- `Editor platform is only available in test mode`
  - 检查 `ENABLE_TEST_MODE=true`
- `Authentication required`
  - 检查 `Authorization: Bearer <token>` 头
- `User not found`
  - 先调用一次 `getUserGameInfoV2` 触发建档

---

## 6. 下一步

- 详细接口字段：看 `接口参考-API_REFERENCE.md`
- 认证细节：看 `认证指南-AUTH_GUIDE.md`
- 环境变量：看 `环境配置-ENV_SETUP.md`
- 部署流程：看 `部署指南-DEPLOYMENT_GUIDE.md`
