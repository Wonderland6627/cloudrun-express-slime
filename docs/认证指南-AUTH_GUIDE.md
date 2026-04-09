# 认证系统指南（JWT）

## 认证流程

1. 客户端调用 `getCode2Session`（带平台 code）
2. 服务端校验平台并签发 JWT（有效期 7 天）
3. 客户端后续请求携带 `Authorization: Bearer <token>`
4. `authMiddleware` 解析 token，并将用户信息注入 `req.user`

---

## 获取 Token

接口：

`POST /api/minigame/getCode2Session`

请求：

```json
{
  "code": "platform-login-code",
  "platform": "wechat"
}
```

响应：

```json
{
  "code": 0,
  "data": {
    "openid": "user_openid",
    "platform": "wechat",
    "unionid": null,
    "session_key": "session_key",
    "token": "jwt-token",
    "appid": "wx-appid-or-null"
  },
  "msg": "success"
}
```

---

## Token 传递方式

推荐方式：

- Header：`Authorization: Bearer <token>`

兼容方式（仍支持）：

- Header：`x-auth-token: <token>`
- Body：`{ "token": "<token>" }`
- Query：`?token=<token>`

---

## 平台支持

### wechat

- 需要 `WX_APPID` 与 `WX_SECRET`
- 调用微信 `jscode2session` 交换 openid/session_key

### editor（测试）

- 仅 `ENABLE_TEST_MODE=true` 时可用
- `code` 可作为开发账号标识（如 `local_test_user_a`）

### douyin / bilibili

- 已预留类型
- 认证逻辑尚未实现

---

## 鉴权后请求上下文

中间件会写入：

```json
{
  "openid": "string",
  "platform": "string",
  "session_key": "string-or-null"
}
```

---

## 环境建议

开发环境：

```bash
NODE_ENV=development
ENABLE_TEST_MODE=true
```

生产环境：

```bash
NODE_ENV=production
ENABLE_TEST_MODE=false
TOKEN_SECRET=<strong-random-secret>
```

---

## 安全建议

1. 生产环境必须替换默认 `TOKEN_SECRET`
2. 仅通过 HTTPS 传输 token
3. 禁止生产环境启用 `editor` 登录
4. 日志中避免记录明文 token（当前 HTTP 日志已做脱敏标记）

---

## 相关文件

- `services/authService.js`
- `utils/tokenManager.js`
- `utils/platformAuth.js`
- `middlewares/auth.js`
