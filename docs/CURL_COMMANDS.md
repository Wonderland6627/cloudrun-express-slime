# 直接复制使用的 curl 测试命令

## 🎯 您的服务域名
```
https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com
```

---

## ⚡ Windows PowerShell 命令（直接复制使用）

### 1. 获取用户游戏信息
```powershell
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfo -H "Content-Type: application/json" -H "x-openid: test123" -d "{}"
```

### 2. 设置用户游戏信息
```powershell
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfo -H "Content-Type: application/json" -H "x-openid: test123" -d "{\"progressLevelID\":5,\"nickName\":\"测试玩家\",\"avatarUrl\":\"https://example.com/avatar.jpg\"}"
```

### 3. 获取排行榜
```powershell
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserRankList -H "Content-Type: application/json" -d "{\"limit\":10}"
```

### 4. 获取关卡配置
```powershell
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getLevelsConfig -H "Content-Type: application/json" -d "{}"
```

### 5. 获取用户信息（使用body传递openid）
```powershell
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfo -H "Content-Type: application/json" -d "{\"openid\":\"test123\"}"
```

---

## 🐧 Linux/Mac 命令（直接复制使用）

### 1. 获取用户游戏信息
```bash
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfo -H "Content-Type: application/json" -H "x-openid: test123" -d "{}"
```

### 2. 设置用户游戏信息
```bash
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfo -H "Content-Type: application/json" -H "x-openid: test123" -d '{"progressLevelID":5,"nickName":"测试玩家","avatarUrl":"https://example.com/avatar.jpg"}'
```

### 3. 获取排行榜
```bash
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserRankList -H "Content-Type: application/json" -d '{"limit":10}'
```

### 4. 获取关卡配置
```bash
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getLevelsConfig -H "Content-Type: application/json" -d "{}"
```

### 5. 获取用户信息（使用body传递openid）
```bash
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfo -H "Content-Type: application/json" -d '{"openid":"test123"}'
```

---

## 📋 完整测试流程（按顺序执行）

### Windows PowerShell：

```powershell
# 步骤1: 创建用户1
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfo -H "Content-Type: application/json" -H "x-openid: player001" -d "{\"progressLevelID\":10,\"nickName\":\"玩家1\"}"

# 步骤2: 创建用户2
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfo -H "Content-Type: application/json" -H "x-openid: player002" -d "{\"progressLevelID\":20,\"nickName\":\"玩家2\"}"

# 步骤3: 获取排行榜
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserRankList -H "Content-Type: application/json" -d "{}"

# 步骤4: 获取玩家1的信息
curl.exe -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfo -H "Content-Type: application/json" -H "x-openid: player001" -d "{}"
```

### Linux/Mac：

```bash
# 步骤1: 创建用户1
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfo -H "Content-Type: application/json" -H "x-openid: player001" -d '{"progressLevelID":10,"nickName":"玩家1"}'

# 步骤2: 创建用户2
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/setUserGameInfo -H "Content-Type: application/json" -H "x-openid: player002" -d '{"progressLevelID":20,"nickName":"Player2"}'

# 步骤3: 获取排行榜
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserRankListV2 -H "Content-Type: application/json" -d "{}"

# 步骤4: 获取玩家1的信息
curl -X POST https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/minigame/getUserGameInfoV2 -H "Content-Type: application/json" -H "x-openid: ox0H16xXrrwRAzCI7IkNoXtsW7CI" -d "{}"
```

---

## 💡 使用说明

1. **Windows 用户**：直接复制 PowerShell 版本的命令到 PowerShell 窗口，按回车执行
2. **Linux/Mac 用户**：直接复制 bash 版本的命令到终端，按回车执行
3. **查看响应**：命令执行后会显示 JSON 格式的响应数据
4. **修改参数**：可以修改 `openid`、`nickName`、`progressLevelID` 等参数进行不同测试

---

## ✅ 预期响应

成功时会返回类似以下的 JSON 数据：
```json
{
  "code": 0,
  "data": { ... },
  "msg": "success"
}
```

失败时会返回：
```json
{
  "code": -1,
  "msg": "error message"
}
```

