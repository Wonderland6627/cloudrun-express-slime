# 版本验证指南

## 📋 如何确认服务使用了最新的代码？

部署后，有多种方法可以验证服务是否使用了最新的代码提交。

## 🔍 方法一：查看版本信息API（推荐）

### 1. 调用版本信息接口

```bash
curl https://express-slime-216111-7-1352845565.sh.run.tcloudbase.com/api/version
curl https://express-slime-dev-216111-7-1352845565.sh.run.tcloudbase.com/api/version

curl https://piratecat.top/api/version
curl https://piratecat.top/dev/api/version
```

### 2. 返回示例

```json
{
  "code": 0,
  "data": {
    "version": "0.0.0",
    "buildTime": "2024-01-15T10:30:45.123Z"
  },
  "msg": "success"
}
```

### 3. 验证方法

- **buildTime**：这是代码构建/部署的时间，每次部署都会更新
- 对比部署时间：在云托管控制台查看部署完成时间，应该与 `buildTime` 一致（可能有几秒误差）

## 🔍 方法二：查看服务启动日志

### 1. 查看日志位置

登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun) → 服务详情 → **"日志"** 标签

### 2. 查找版本信息

服务启动时，日志会输出：

```
🚀 Server Starting - v0.0.0 (build: 2024-01-15T10:30:45.123Z)
```

### 3. 验证方法

- 查看最新的启动日志中的 `buildTime`
- 对比部署完成时间，应该一致

## 🔍 方法三：查看云托管控制台部署历史

### 1. 查看部署记录

1. 登录 [腾讯云托管控制台](https://console.cloud.tencent.com/tcb/cloudrun)
2. 进入服务详情页
3. 点击 **"版本管理"** 或 **"部署历史"** 标签
4. 查看最新的部署记录

### 2. 验证信息

- **部署时间**：记录部署完成的时间
- **部署状态**：应该是"运行中"或"部署成功"
- **代码源**：显示使用的代码来源（Git仓库/本地代码）

### 3. Git部署模式

如果使用Git部署：
- 查看 **"代码版本"** 或 **"Commit"** 信息
- 对比本地最新commit，应该一致

## 🔍 方法四：通过功能验证

### 1. 添加测试功能

在代码中添加一个明显的测试功能，部署后验证：

```javascript
// 例如：在某个API返回中增加版本标识
router.get('/api/test', (req, res) => {
  res.json({
    version: 'v1.2.3-test', // 每次部署修改这个值
    message: 'This is the latest version'
  });
});
```

### 2. 部署后调用测试接口

```bash
curl https://your-service-domain/api/test
```

### 3. 验证返回结果

如果返回的是最新添加的测试值，说明部署成功。

## 🔍 方法五：查看环境变量变化

如果本次部署修改了环境变量：

### 1. 在代码中输出环境变量

```javascript
// 在启动时输出
console.log('TCB_ENV:', process.env.TCB_ENV);
console.log('Custom Config:', process.env.CUSTOM_CONFIG);
```

### 2. 查看日志

在服务日志中查看环境变量值，确认是否与最新配置一致。

## ⚠️ 常见问题

### Q1: buildTime 和部署时间不一致？

**A**: 这是正常的：
- `buildTime` 是代码构建时的时间（Docker镜像构建时间）
- 部署时间可能比构建时间晚几分钟（包含上传、部署等步骤）
- 通常差异在1-5分钟内是正常的

### Q2: 部署后立即调用API，返回的还是旧版本？

**A**: 可能的原因：
1. **部署未完成**：等待部署状态变为"运行中"
2. **缓存问题**：清除浏览器缓存或使用无痕模式
3. **CDN缓存**：如果使用了CDN，可能需要等待缓存过期
4. **负载均衡**：如果有多个实例，可能部分实例还未更新

### Q3: 如何强制使用最新代码？

**A**: 
1. 确保部署状态为"运行中"
2. 等待1-2分钟让所有实例更新
3. 如果仍有问题，尝试重启服务

## 📝 最佳实践

1. **每次部署前记录版本号**
   - 在代码中更新 `package.json` 的 `version` 字段
   - 或添加部署标签

2. **使用版本API验证**
   - 部署后立即调用 `/api/version` 接口
   - 确认 `buildTime` 是最新的

3. **查看部署日志**
   - 部署完成后查看服务日志
   - 确认启动日志中的版本信息

4. **功能测试**
   - 部署后测试关键功能
   - 确认新功能已生效

## 🔗 相关文档

- [部署指南](./部署指南-DEPLOYMENT_GUIDE.md)
- [API测试指南](./接口测试-TEST_API.md)

