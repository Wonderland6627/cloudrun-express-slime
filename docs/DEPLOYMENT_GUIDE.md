# 腾讯云托管部署指南

本指南将帮助您将Express应用部署到腾讯云托管服务。

## 📋 前置准备

1. **腾讯云账号**
   - 访问 [腾讯云官网](https://cloud.tencent.com/) 注册账号
   - 完成实名认证（必须）

2. **本地环境**
   - 确保已安装 Node.js 8.2.0 及以上版本
   - 确保项目可以正常运行

## 🚀 部署步骤

### 第一步：本地测试

在部署前，先在本地测试服务是否正常：

```bash
# 1. 安装依赖
npm install

# 2. 创建环境变量文件（可选，如果不创建会使用代码中的默认值）
# Windows PowerShell:
Copy-Item .env.example .env
# 然后编辑 .env 文件，填入您的配置

# 3. 启动服务
npm start

# 4. 测试API（在另一个终端）
# 测试获取用户信息接口
curl -X POST http://localhost:3000/api/minigame/getUserGameInfo -H "Content-Type: application/json" -d "{\"openid\":\"test123\"}"
```

### 第二步：登录腾讯云控制台

1. 访问 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 登录您的账号

### 第三步：创建云开发环境

1. 在控制台搜索 **"云开发 CloudBase"** 或访问 [云开发控制台](https://console.cloud.tencent.com/tcb)
2. 点击 **"新建环境"**
3. 填写环境信息：
   - **环境名称**：自定义（如：my-game-server）
   - **计费方式**：选择 **按量计费**（适合测试）
   - 同意服务协议
4. 点击 **"立即开通"**，等待环境创建完成（约1-2分钟）

### 第四步：创建云托管服务

1. 在云开发控制台，选择您刚创建的环境
2. 在左侧菜单找到 **"云托管"**，点击进入
3. 点击 **"新建服务"**
4. 填写服务信息：
   - **服务名称**：自定义（如：minigame-api）
   - **部署类型**：选择 **容器服务**
   - 点击 **"提交"**

### 第五步：部署代码

有两种部署方式：

#### 方式一：通过本地代码部署（推荐新手）

1. 在云托管服务页面，点击 **"新建版本"**
2. 选择 **"通过本地代码"**
3. 填写配置信息：
   - **代码包类型**：选择 **文件夹**
   - **代码包**：点击选择，上传整个项目文件夹（`cloudrun-express-slime`）
   - **服务名称**：已自动填充
   - **部署类型**：容器服务
   - **端口**：填写 `3000`
   - **Dockerfile 名称**：`Dockerfile`（已存在）
   - **环境变量**：点击添加，填入以下变量：
     ```
     WX_APPID=wxf55f604f65c8f87b
     WX_SECRET=eb43d3e9ed536c22db4234393bb861bf
     ```
   - **公网访问**：开启 ✅
   - **内网访问**：关闭（按需）
4. 点击 **"部署"**，等待部署完成（约5-10分钟）

#### 方式二：通过Git仓库部署（推荐有Git经验的开发者）

1. 将代码推送到Git仓库（GitHub、GitLab、Gitee等）
2. 在云托管服务页面，点击 **"新建版本"**
3. 选择 **"通过Git仓库"**
4. 连接您的Git仓库
5. 选择分支和Dockerfile路径
6. 配置环境变量（同上）
7. 点击 **"部署"**

### 第六步：获取访问地址

1. 部署完成后，在服务详情页点击 **"概述"**
2. 找到 **"默认域名"**，这就是您的API访问地址
3. 例如：`https://your-service-xxx.tcb.qcloud.la`

### 第七步：测试部署

使用以下命令测试您的API（替换为您的实际域名）：

```bash
# 测试健康检查
curl https://your-service-xxx.tcb.qcloud.la/

# 测试获取用户信息
curl -X POST https://your-service-xxx.tcb.qcloud.la/api/minigame/getUserGameInfo \
  -H "Content-Type: application/json" \
  -d "{\"openid\":\"test123\"}"
```

## 🔧 常见问题

### 1. 部署失败怎么办？

- 检查 Dockerfile 是否正确
- 检查环境变量是否配置正确
- 查看部署日志，找到具体错误信息

### 1.1. 健康检查失败（Readiness probe failed / Liveness probe failed）

**错误信息**：
```
Readiness probe failed: dial tcp 10.30.2.12:80: connect: connection refused
Liveness probe failed: dial tcp 10.30.2.12:80: connect: connection refused
```

**原因**：
- 腾讯云托管默认使用端口 80 进行健康检查
- Express 服务默认监听端口 3000
- 端口不匹配导致健康检查失败

**解决方案**：
- ✅ **已修复**：Dockerfile 中已设置 `ENV PORT=80`，服务会自动监听 80 端口
- 如果使用 Git 部署，确保 Dockerfile 已更新并提交到仓库
- 如果使用本地代码部署，确保使用最新的 Dockerfile

**验证**：
- 部署时在云托管配置中，端口应设置为 `80`（或留空使用默认值）
- 服务启动后会在 80 端口监听

### 2. 如何查看服务日志？

- 在服务详情页，点击 **"日志"** 标签
- 可以查看实时日志和错误信息

### 3. 如何更新代码？

- 修改代码后，重复 **第五步** 的操作
- 创建新版本并部署
- 新版本部署成功后会自动替换旧版本

### 4. 如何配置自定义域名？

- 在服务详情页，点击 **"域名管理"**
- 添加您的自定义域名
- 按照提示配置DNS解析

## 📝 API接口说明

所有接口都使用 POST 方法，基础路径：`/api/minigame`

### 1. getCode2Session - 微信登录
```
POST /api/minigame/getCode2Session
Body: { "code": "微信登录code" }
```

### 2. getUserGameInfo - 获取用户游戏信息
```
POST /api/minigame/getUserGameInfo
Header: x-openid: 用户openid
或
Body: { "openid": "用户openid" }
```

### 3. setUserGameInfo - 设置用户游戏信息
```
POST /api/minigame/setUserGameInfo
Header: x-openid: 用户openid
Body: { "progressLevelID": 1, "nickName": "玩家名", ... }
```

### 4. getUserRankList - 获取排行榜
```
POST /api/minigame/getUserRankList
Body: { "limit": 100 }  // 可选
```

### 5. getLevelsConfig - 获取关卡配置
```
POST /api/minigame/getLevelsConfig
Body: { "levelId": "关卡ID" }  // 可选，默认使用测试ID
```

## ⚠️ 重要提示

1. **当前使用的是内存数据库**：数据在服务重启后会丢失，仅用于测试
2. **生产环境需要替换为真实数据库**：后续需要连接腾讯云MongoDB或MySQL
3. **安全性**：生产环境建议使用环境变量存储敏感信息，不要硬编码
4. **跨域问题**：如果前端有跨域问题，需要在 `app.js` 中添加CORS中间件

## 🔄 下一步：连接真实数据库

当您需要连接真实数据库时：

1. 在腾讯云创建MongoDB或MySQL实例
2. 获取数据库连接信息
3. 修改 `utils/mockDatabase.js`，替换为真实数据库操作
4. 添加数据库连接库（如 `mongodb` 或 `mysql2`）
5. 更新环境变量配置

## 📞 需要帮助？

- 查看 [腾讯云托管官方文档](https://cloud.tencent.com/document/product/1243)
- 查看项目 README.md
- 检查服务日志排查问题
