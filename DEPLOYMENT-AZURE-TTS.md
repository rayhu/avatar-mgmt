# Azure TTS 后端部署指南

## 概述

本指南将帮助你配置后端 Azure TTS 服务，避免在前端暴露 Azure 密钥，提高安全性。

## 安全优势

✅ **Azure 密钥不暴露给前端**  
✅ **更好的安全性** - 敏感凭据保留在服务器上  
✅ **可以实现速率限制**  
✅ **可以实现缓存** - 提高性能  
✅ **集中式日志记录和监控**  

## 配置步骤

### 1. 获取 Azure Speech Service 凭据

1. 访问 [Azure Portal](https://portal.azure.com)
2. 创建或选择现有的 Speech Service 资源
3. 在"密钥和终结点"部分获取：
   - **密钥 1** 或 **密钥 2**
   - **区域**（如：eastasia, westus2 等）

### 2. 配置后端环境变量

在 `api-server` 目录下创建 `.env` 文件：

```env
# Azure Speech Service Configuration
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=eastasia

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=directus
DB_USER=directus
DB_PASSWORD=directus

# Directus Configuration
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=your_directus_token_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. 测试配置

运行测试脚本验证配置：

```bash
cd api-server
yarn test:azure
```

如果测试通过，你会看到：
- ✅ 直接 Azure TTS 测试通过
- ✅ 后端 API 测试通过
- 生成的测试音频文件

### 4. 启动服务

```bash
# 开发模式
yarn dev

# 生产模式
yarn start
```

## API 端点

### POST /api/azure-tts

**请求体：**
```json
{
  "ssml": "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\"zh-CN\"><voice name=\"zh-CN-XiaoxiaoNeural\">你好世界</voice></speak>",
  "voice": "zh-CN-XiaoxiaoNeural"
}
```

**响应：**
- 成功：`audio/mpeg` 二进制数据
- 失败：JSON 错误信息

## 前端配置

前端会自动使用后端 API，无需额外配置。

### 强制前端模式（不推荐）

如果需要在前端直接使用 Azure TTS（不推荐用于生产环境），在 `frontend/.env` 中设置：

```env
VITE_AZURE_SPEECH_KEY=your_key_here
```

## 故障排除

### 常见错误

1. **"Azure Speech credentials are not configured"**
   - 检查 `.env` 文件中的 `AZURE_SPEECH_KEY` 和 `AZURE_SPEECH_REGION`

2. **"Azure TTS request failed"**
   - 检查 Azure 密钥是否有效
   - 检查区域是否正确
   - 检查 Azure 账户是否有足够的配额

3. **"Method not allowed"**
   - 确保使用 POST 方法调用 API

### 调试步骤

1. 运行测试脚本：`yarn test:azure`
2. 检查 API 服务器日志
3. 验证环境变量是否正确加载
4. 检查网络连接和防火墙设置

## 性能优化

### 缓存策略

后端 API 已配置缓存头：
```
Cache-Control: public, max-age=3600
```

### 建议的优化

1. **Redis 缓存** - 缓存常用的 SSML 到音频映射
2. **CDN** - 使用 CDN 分发音频文件
3. **压缩** - 启用 gzip 压缩
4. **速率限制** - 防止滥用

## 监控和日志

### 日志记录

API 服务器会记录：
- 请求/响应状态
- 错误详情
- 处理时间

### 监控指标

建议监控：
- API 调用次数
- 错误率
- 响应时间
- Azure 配额使用情况

## 生产部署

### Docker 部署

```bash
# 构建镜像
docker build -t avatar-api-server .

# 运行容器
docker run -d \
  --name avatar-api \
  -p 3000:3000 \
  --env-file .env \
  avatar-api-server
```

### 环境变量管理

生产环境建议使用：
- Docker secrets
- Kubernetes secrets
- 云服务商的密钥管理服务

## 安全最佳实践

1. **永远不要在前端暴露 Azure 密钥**
2. **使用环境变量管理敏感信息**
3. **实施速率限制**
4. **启用 HTTPS**
5. **定期轮换密钥**
6. **监控异常访问**

## 支持

如果遇到问题，请检查：
1. [Azure Speech Service 文档](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
2. API 服务器日志
3. 测试脚本输出 
