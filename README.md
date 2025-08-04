# 数字人形象库管理网站 (Digital Avatar Management System)

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://amis-avatar-mgmt.vercel.app)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📝 项目简介 (Project Introduction)

本项目是一个完整的数字人形象管理系统，包含前端展示界面、**自定义 API Server** (详见 [docs/api-server.md](./docs/api-server.md)) 和 Directus 后端管理平台。系统支持 3D 数字人形象的上传、管理、预览和展示，并提供完整的 API 接口供其他系统集成。

## 🚀 快速开始 (Quick Start)

### 环境要求 (Requirements)
- Node.js >= 18.0.0
- Yarn >= 1.22.0
- Docker & Docker Compose

### 本地开发 (Local Development)

1. 克隆项目
```bash
git clone [repository-url]
cd avatar-mgmt
```

2. 启动后端服务（Docker Compose）

本仓库提供三套 Compose 文件：

| 场景 | 文件 | 常用启动命令 | 说明 |
| ---- | ----- | ------------- | ---- |
| 本地开发 | `docker-compose.dev.yml` | `docker compose -f docker-compose.dev.yml up -d --build` | 开发调试用 |
| **本地测试** | `docker-compose.stage.yml` | `docker compose -f docker-compose.stage.yml up -d --build` | **推荐：本地Docker测试环境** |
| **生产** | `docker-compose.prod.yml` | `./deploy-daidai-simple.sh` | 生产部署专用 |

**⚠️ 重要提醒**：本地测试Docker时请使用stage环境，避免误操作生产配置：

```bash
# ✅ 推荐：本地测试
docker compose -f docker-compose.stage.yml up -d --build

# ❌ 避免：本地使用生产配置
docker compose -f docker-compose.prod.yml up -d --build
```

例如本地开发调试：
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

停止并清理：
```bash
docker compose -f docker-compose.dev.yml down -v   # 如需保留数据去掉 -v
```

生产服务器部署：
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

先执行 docker compose -f docker-compose.prod.yml build --no-cache
再执行 docker compose -f docker-compose.prod.yml up -d
这样的生产环境镜像一定是全新构建的，不会有任何缓存残留。

更多参数与端口说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

3. 启动前端开发服务器
```bash
cd frontend
yarn install
yarn dev
```

### 访问地址 (Access URLs)

- 前端开发服务器：http://localhost:5173
- 后端API：http://localhost:3000
- DIRECTUS管理界面：http://localhost:8055

### 登录信息 (Login Credentials)

#### 前端 (Frontend)
- 用户名：admin
- 密码：admin123

#### Directus
- 邮箱：admin@example.com
- 密码：admin1234

## 🛠 技术栈 (Tech Stack)

### 前端 (Frontend)
- Vue 3 + TypeScript
- Vite 作为构建工具
- Three.js 用于 3D 渲染
- Pinia 状态管理
- Vue Router 路由管理
- Vue I18n 国际化
- Microsoft Cognitive Services Speech SDK 语音服务
- SASS 样式处理
- PWA 支持

### 后端 (Backend)
- Directus (基于 Node.js + Express)
- SQL 数据库支持 (MySQL/PostgreSQL)
- REST API & GraphQL API
- WebSocket 实时推送
- 细粒度权限控制

## ✨ 核心功能 (Core Features)

### 🎭 模型管理
✅ **形象管理**：上传、编辑、删除数字人形象  
✅ **版本控制**：支持模型版本管理和状态跟踪  
✅ **元数据管理**：形象属性（名字、用途、风格、版本等）管理  
✅ **状态管理**：草稿、待审核、处理中、就绪、错误等状态流转  

### 🎬 创作功能
✅ **语音动画导出**：集成Azure TTS语音合成和动画时间轴  
✅ **动作表情测试**：实时预览模型动作和表情效果  
✅ **3D预览渲染**：基于Three.js的高质量3D模型展示  

### 👥 用户体验
✅ **权限和用户管理**：管理员和普通用户的差异化权限控制  
✅ **响应式设计**：完美适配桌面端和移动端  
✅ **集成操作流程**：从模型浏览到功能使用的一体化体验  

### 🔌 技术集成
✅ **API 接口**：供前台客服端调用数字人形象数据  
✅ **多语言支持**：中英文国际化  
✅ **实时日志**：完整的操作日志和错误追踪

## 🚢 部署 (Deployment)

CICD的测试项目已部署在 Vercel 上：
- 主域名：https://amis-avatar-mgmt.vercel.app
### 部署命令
```bash
npx vercel --prod
```

生产服务器部署在Azure上
- 主域名：https://daidai.amis.hk
- API域名：https://api.daidai.amis.hk
- CMS域名：https://directus.daidai.amis.hk

### 自托管部署选项

#### 🎯 部署（Nginx Proxy Manager）

使用图形化界面管理反向代理和 SSL 证书，大大简化配置复杂度：

```bash
# 一键部署
./deploy-daidai-simple.sh

# 访问管理界面：http://你的服务器IP:81
# 默认账号：admin@example.com / changeme
```

详细配置请参考 [简化部署指南](./DEPLOY-DAIDAI-SIMPLE.md)。

#### 🔧 传统部署（手动 Nginx 配置）

对于需要精细控制的高级用户：

```bash
# 配置 SSL 证书
./init-letsencrypt.sh your-domain.com your-email@domain.com

# 启动生产服务
docker compose -f docker-compose.prod.yml up -d
```

详细配置说明请参考 [SSL 配置文档](./docs/ssl-setup.md)。

### SSL 证书配置

对于自托管部署，项目支持 Let's Encrypt SSL 证书自动配置：

```bash
# 配置 SSL 证书
./init-letsencrypt.sh your-domain.com your-email@domain.com

# 启动生产服务
docker compose -f docker-compose.prod.yml up -d
```

详细配置说明请参考 [SSL 配置文档](./docs/ssl-setup.md)。

## 🔧 服务管理 (Service Management)

### 后端服务
```bash
docker-compose stop      # 停止
docker-compose start     # 启动
docker-compose down      # 停止并清理容器
```

### 本地数据说明
- 所有文件、数据库都映射在本地目录（db_data、uploads、db_json、schemas）
- 支持数据迁移和备份
- 可以随时重启、升级或复制环境

## 📚 文档 (Documentation)

### **主要文档**
- [📖 **文档中心**](./docs/README.md) - 完整文档导航和索引
- [🚀 **部署指南**](./DEPLOYMENT.md) - 生产环境部署完整指南  
- [📝 **更新日志**](./CHANGELOG.md) - 版本变更和新功能记录
- [🔄 **迁移指南**](./docs/MIGRATION.md) - 从旧架构迁移到新架构

### **技术文档**
- [💻 **前端开发**](./frontend/README.md) - Vue 3 应用开发指南
- [🔌 **API Server**](./docs/api-server.md) - 后端 API 接口文档
- [🎵 **Azure TTS**](./docs/azure-tts/README.md) - 语音服务集成
- [🏗️ **Azure TTS 部署**](./DEPLOYMENT-AZURE-TTS.md) - Azure 语音服务部署

### **在线资源**
- [🌐 **API 接口文档**](https://api.daidai.amis.hk/docs) - 在线 API 文档
- [🧪 **测试环境**](https://amis-avatar-mgmt.vercel.app) - Vercel 测试部署

