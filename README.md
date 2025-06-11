# 数字人形象库管理网站 (Digital Human Avatar Management System)

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://amis-avatar-mgmt.vercel.app)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 📝 项目简介 (Project Introduction)

本项目是一个完整的数字人形象管理系统，包含前端展示界面和后端管理平台。系统支持 3D 数字人形象的上传、管理、预览和展示，并提供完整的 API 接口供其他系统集成。

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

2. 启动后端服务
```bash
docker-compose up -d
```

3. 启动前端开发服务器
```bash
cd frontend
yarn install
yarn dev
```

### 访问地址 (Access URLs)

- 前端开发服务器：http://localhost:5173
- 后端管理界面：http://localhost:8055

### 登录信息 (Login Credentials)

#### 前端 (Frontend)
- 用户名：admin
- 密码：admin123

#### 后端 (Backend)
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

✅ 形象管理：上传、编辑、删除数字人形象
✅ 元数据管理：形象属性（如名字、用途、风格等）管理
✅ 预览和展示：可视化预览形象，包括动画或静态图
✅ 权限和用户管理：不同用户角色权限控制
✅ API 接口：供前台客服端调用数字人形象数据

## 🚢 部署 (Deployment)

项目已部署在 Vercel 上：
- 主域名：https://amis-avatar-mgmt.vercel.app

### 部署命令
```bash
npx vercel --prod
```

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

- [前端开发文档](./frontend/README.md)
- [API 文档](https://amis-avatar-mgmt.vercel.app/docs)

