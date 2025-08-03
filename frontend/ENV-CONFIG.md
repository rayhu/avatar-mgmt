# 环境变量配置说明

## 概述
前端应用现在支持通过环境变量配置 API 和 Directus 的 baseUrl。

## 环境变量

### VITE_API_BASE_URL
- **说明**: API 服务器的基础 URL
- **默认值**: 
  - 开发环境: `http://api.daidai.localhost:3000`
  - 生产环境: `https://api.daidai.amis.hk`

### VITE_DIRECTUS_BASE_URL  
- **说明**: Directus CMS 的基础 URL
- **默认值**:
  - 开发环境: `http://directus.daidai.localhost:8055`
  - 生产环境: `https://directus.daidai.amis.hk`

## 使用方法

### 1. 创建环境变量文件

**开发环境** (`.env.local`):
```bash
VITE_API_BASE_URL=http://api.daidai.localhost:3000
VITE_DIRECTUS_BASE_URL=http://directus.daidai.localhost:8055
```

**生产环境** (`.env.production`):
```bash
VITE_API_BASE_URL=https://api.daidai.amis.hk
VITE_DIRECTUS_BASE_URL=https://directus.daidai.amis.hk
```

**Stage 环境** (`.env.staging`):
```bash
VITE_API_BASE_URL=http://api.daidai.localhost:3000
VITE_DIRECTUS_BASE_URL=http://directus.daidai.localhost:8055
```

### 2. 构建和运行

**开发模式**:
```bash
yarn dev
```

**生产模式**:
```bash
# 构建
yarn build:prod

# 预览
yarn preview:prod
```

## 服务器部署

在服务器上，您可以通过以下方式设置环境变量：

### 方法 1: 创建 .env.production 文件
```bash
cd frontend
echo "VITE_API_BASE_URL=https://api.daidai.amis.hk" > .env.production
echo "VITE_DIRECTUS_BASE_URL=https://directus.daidai.amis.hk" >> .env.production
```

### 方法 2: 在构建时传入环境变量
```bash
VITE_API_BASE_URL=https://api.daidai.amis.hk \
VITE_DIRECTUS_BASE_URL=https://directus.daidai.amis.hk \
yarn build:prod
```

### 方法 3: 使用 Docker 环境变量
```dockerfile
ENV VITE_API_BASE_URL=https://api.daidai.amis.hk
ENV VITE_DIRECTUS_BASE_URL=https://directus.daidai.amis.hk
```

## 验证配置

在浏览器控制台中运行以下代码来验证配置：
```javascript
// 查看当前环境变量
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Directus Base URL:', import.meta.env.VITE_DIRECTUS_BASE_URL);
console.log('Current Mode:', import.meta.env.MODE);
```
