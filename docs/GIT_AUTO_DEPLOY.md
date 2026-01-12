# Git自动部署配置指南

## 📋 概述

使用Git模式部署到腾讯云托管时，**默认情况下代码提交后不会自动生效**，需要手动触发部署。本指南将帮助您配置自动部署，实现代码推送后自动部署。

## ⚠️ 默认行为

**重要**：Git部署模式默认**不会自动部署**！

- ✅ 代码提交到Git仓库 → **不会自动触发部署**
- ❌ 需要手动在云托管控制台点击"部署"按钮
- 🔄 每次代码更新都需要手动操作

## 🚀 配置自动部署（Webhook）

### 步骤一：获取Webhook URL

1. 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 选择您的服务（如：cloudrun-express-slime）
3. 进入服务详情页
4. 查找 **"自动部署"**、**"Webhook"** 或 **"持续集成"** 设置
5. 复制云托管提供的Webhook URL

   ```
   格式示例：https://tcb-xxx.cloudbase.net/webhook/xxx
   ```

### 步骤二：在Git仓库中配置Webhook

#### GitHub配置

1. 进入您的GitHub仓库
2. 点击 **Settings** → **Webhooks** → **Add webhook**
3. 填写配置：
   - **Payload URL**: 粘贴云托管提供的Webhook URL
   - **Content type**: 选择 `application/json`
   - **Which events**: 选择 `Just the push event`（仅推送事件）
   - **Active**: ✅ 勾选
4. 点击 **Add webhook**

#### Gitee配置

1. 进入您的Gitee仓库
2. 点击 **管理** → **WebHooks** → **添加WebHook**
3. 填写配置：
   - **URL**: 粘贴云托管提供的Webhook URL
   - **推送事件**: ✅ 勾选
   - **Tag推送事件**: 可选
4. 点击 **添加**

#### GitLab配置

1. 进入您的GitLab仓库
2. 点击 **Settings** → **Webhooks**
3. 填写配置：
   - **URL**: 粘贴云托管提供的Webhook URL
   - **Trigger**: 选择 `Push events`
   - **Branch**: 选择要监听的分支（如：`main`）
4. 点击 **Add webhook**

### 步骤三：验证配置

1. 在Git仓库中推送一次代码：
   ```bash
   git add .
   git commit -m "test auto deploy"
   git push
   ```

2. 在云托管控制台查看：
   - 进入服务详情页 → **"版本管理"** 或 **"部署历史"**
   - 应该能看到新的部署任务自动启动
   - 等待部署完成

3. 测试服务：
   ```bash
   # 测试API是否已更新
   curl https://your-domain/api/minigame/getUserGameInfoV2
   ```

## 🔍 检查自动部署是否生效

### 方法一：查看部署历史

1. 在云托管控制台的版本管理页面
2. 查看最近的部署记录
3. 如果看到部署时间与代码推送时间一致，说明自动部署已生效

### 方法二：查看Webhook日志

1. 在Git仓库的Webhook设置中
2. 查看最近的Webhook请求记录
3. 确认请求状态为 `200 OK` 或 `成功`

### 方法三：测试推送

1. 修改代码并提交
2. 推送到Git仓库
3. 观察云托管控制台是否自动开始部署

## ❓ 常见问题

### Q1: 配置Webhook后仍然需要手动部署？

**可能原因**：
- Webhook URL配置错误
- Git仓库的Webhook权限未正确设置
- 云托管服务未启用自动部署功能

**解决方法**：
1. 检查Webhook URL是否正确
2. 在Git仓库中查看Webhook请求日志，确认是否有错误
3. 联系腾讯云技术支持确认服务是否支持自动部署

### Q2: 自动部署失败怎么办？

**可能原因**：
- 代码构建失败
- 环境变量配置错误
- Dockerfile路径不正确

**解决方法**：
1. 查看部署日志，找到具体错误信息
2. 在本地测试构建：`docker build -t test .`
3. 检查环境变量配置是否正确

### Q3: 只想在特定分支推送时自动部署？

**解决方法**：
- 在Git仓库的Webhook配置中，设置分支过滤规则
- 例如：只在 `main` 分支推送时触发
- 或者在云托管控制台配置分支规则

### Q4: 如何禁用自动部署？

**解决方法**：
- 在Git仓库的Webhook设置中，删除或禁用Webhook
- 或者在云托管控制台关闭自动部署功能

## 📝 最佳实践

1. **使用分支策略**：
   - `main/master`: 生产环境，自动部署
   - `develop`: 开发环境，手动部署
   - `feature/*`: 功能分支，不自动部署

2. **测试后再启用**：
   - 首次配置自动部署时，先在测试环境验证
   - 确认无误后再应用到生产环境

3. **监控部署状态**：
   - 定期查看部署历史
   - 设置部署失败通知
   - 关注服务日志

4. **控制部署频率**：
   - 避免频繁的小改动触发部署
   - 可以合并多个提交后再推送

## 🎯 总结

- ✅ **默认情况**：Git部署需要手动触发
- ✅ **配置Webhook后**：代码推送会自动触发部署
- ✅ **推荐做法**：生产环境配置自动部署，开发环境手动部署

配置完成后，您的工作流程将变为：
```
修改代码 → git commit → git push → 自动部署 → 服务更新 ✅
```
