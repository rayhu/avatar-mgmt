# 环境变量配置说明

## 概述

本项目使用环境变量来配置不同环境的 API 端点。前端不再直接访问 Directus，而是通过 API
Server 进行所有数据交互。

## 环境变量

### VITE_API_BASE_URL

API Server 的基础 URL，用于所有 API 请求。

**开发环境**

```bash
VITE_API_BASE_URL=http://localhost:3000
```

**生产环境**

```bash
VITE_API_BASE_URL=https://api.daidai.amis.hk
```

**Staging 环境**

```bash
VITE_API_BASE_URL=https://api.daidai-preview.amis.hk
```

## 环境配置

### 开发环境

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3000
```

### 生产环境

```bash
# Docker 部署时设置
VITE_API_BASE_URL=https://api.daidai.amis.hk
```

### Staging 环境

```bash
# Docker 部署时设置
VITE_API_BASE_URL=https://api.daidai-preview.amis.hk
```

## 架构说明

```
前端 → API Server → Directus
```

- **前端** 只与 **API Server** 通信
- **API Server** 负责与 **Directus** 交互
- 提高了安全性和可维护性

## 部署配置

### Docker 部署

```bash
docker run -d \
  -p 80:80 \
  -e VITE_API_BASE_URL=https://api.daidai.amis.hk \
  your-frontend-image
```

### 环境变量验证

在浏览器控制台中可以看到：

```javascript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

## 注意事项

1. **不再需要** `VITE_DIRECTUS_BASE_URL`
2. **所有数据请求** 都通过 API Server
3. **资源文件访问** 也通过 API Server 代理
4. **提高了安全性** 和 **架构清晰度**
