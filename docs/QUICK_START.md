# 快速开始

## 🎯 项目概述

本项目将微信云开发的云函数迁移到腾讯云托管的Express服务，实现跨平台支持。

## ⚡ 5分钟快速体验

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start
```

服务将在 `http://localhost:3000` 启动

### 3. 测试接口

打开新的终端窗口，运行：

```bash
# 测试获取用户信息（会自动创建空记录）
curl -X POST http://localhost:3000/api/minigame/getUserGameInfo \
  -H "Content-Type: application/json" \
  -H "x-openid: test123" \
  -d "{}"
```

如果看到返回JSON数据，说明服务运行正常！

## 📁 项目结构

```
cloudrun-express-slime/
├── app.js                 # Express应用主文件
├── routes/
│   ├── index.js          # 首页路由
│   ├── users.js          # 用户路由（示例）
│   └── minigame.js       # 小游戏API路由 ⭐
├── utils/
│   ├── wechatAuth.js     # 微信认证工具 ⭐
│   ├── cloudbaseDB.js   # CloudBase数据库工具 ⭐
│   └── version.js        # 版本信息模块
├── package.json          # 项目依赖
├── Dockerfile           # Docker构建文件
├── DEPLOYMENT_GUIDE.md  # 详细部署指南 📖
├── TEST_API.md          # API测试指南 📖
└── QUICK_START.md       # 本文件
```

## 🔌 核心API接口

所有接口路径前缀：`/api/minigame`

| 接口 | 说明 | 需要参数 |
|------|------|----------|
| `POST /getCode2Session` | 微信登录，获取openid | `code` (微信登录code) |
| `POST /getUserGameInfo` | 获取用户游戏信息 | `openid` (header或body) |
| `POST /setUserGameInfo` | 设置用户游戏信息 | `openid` + 游戏数据 |
| `POST /getUserRankList` | 获取排行榜 | 无（可选limit） |
| `POST /getLevelsConfig` | 获取关卡配置 | 无（可选levelId) |

## 📝 接口调用示例

### Unity C# 调用示例

```csharp
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

public class GameAPI : MonoBehaviour
{
    private string baseUrl = "http://localhost:3000/api/minigame";
    
    // 获取用户游戏信息
    public IEnumerator GetUserGameInfo(string openid)
    {
        string url = baseUrl + "/getUserGameInfo";
        
        using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes("{}");
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("x-openid", openid);
            
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                Debug.Log("Response: " + request.downloadHandler.text);
                // 解析JSON数据
            }
            else
            {
                Debug.LogError("Error: " + request.error);
            }
        }
    }
    
    // 设置用户游戏信息
    public IEnumerator SetUserGameInfo(string openid, int levelId, string nickName)
    {
        string url = baseUrl + "/setUserGameInfo";
        string jsonData = $"{{\"progressLevelID\":{levelId},\"nickName\":\"{nickName}\"}}";
        
        using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("x-openid", openid);
            
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                Debug.Log("Update success: " + request.downloadHandler.text);
            }
        }
    }
}
```

### JavaScript/TypeScript 调用示例

```javascript
// 获取用户游戏信息
async function getUserGameInfo(openid) {
  const response = await fetch('http://localhost:3000/api/minigame/getUserGameInfo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-openid': openid
    },
    body: JSON.stringify({})
  });
  
  const data = await response.json();
  console.log('User info:', data);
  return data;
}

// 设置用户游戏信息
async function setUserGameInfo(openid, gameInfo) {
  const response = await fetch('http://localhost:3000/api/minigame/setUserGameInfo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-openid': openid
    },
    body: JSON.stringify(gameInfo)
  });
  
  const data = await response.json();
  return data;
}
```

## 🚀 部署到腾讯云

详细步骤请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

简要步骤：
1. 登录腾讯云控制台
2. 创建云开发环境
3. 创建云托管服务
4. 上传代码并部署
5. 获取访问域名

## ⚠️ 重要提示

1. **数据库配置**：项目已集成CloudBase文档型数据库，需要在云托管控制台配置 `TCB_ENV` 环境变量
2. **安全性**：生产环境请使用环境变量存储敏感信息

## 📚 相关文档

- [部署指南](./DEPLOYMENT_GUIDE.md) - 详细的部署步骤
- [API测试指南](./TEST_API.md) - 如何测试接口
- [腾讯云托管文档](https://cloud.tencent.com/document/product/1243)

## ❓ 常见问题

**Q: 如何配置数据库？**  
A: 在云托管控制台配置 `TCB_ENV` 环境变量，指向您的云开发环境ID。详细步骤见[数据库配置指南](./CLOUDBASE_CONFIG.md)。

**Q: 微信登录code从哪里获取？**  
A: 在Unity中调用微信SDK的登录接口，会返回code，然后调用 `getCode2Session` 接口。

**Q: 如何支持B站、抖音等平台？**  
A: 需要添加对应的认证接口，类似微信的 `code2Session`，然后统一用户标识系统。

## 🎉 下一步

1. ✅ 本地测试通过
2. 📖 阅读部署指南
3. 🚀 部署到腾讯云
4. 🔌 连接真实数据库
5. 🎮 在Unity中集成API调用
