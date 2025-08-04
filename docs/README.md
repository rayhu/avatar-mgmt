# 📚 文档中心

数字人形象库管理系统的完整技术文档。

## 🚀 **快速开始**

| 文档 | 描述 | 状态 |
|------|------|------|
| [**主 README**](../README.md) | 项目概述和快速开始指南 | ✅ 最新 |
| [**部署指南**](../DEPLOYMENT.md) | 生产环境部署完整指南 | ✅ 最新 |
| [**更新日志**](../CHANGELOG.md) | 版本变更和新功能记录 | ✅ 最新 |

## 🛠️ **技术文档**

### **API 相关**
- [**API Server**](./api-server.md) - BFF 服务文档和端点说明
- [**Azure TTS**](./azure-tts/README.md) - Azure 语音服务集成

### **部署相关 (历史版本)**
- [**部署指南 (旧版)**](./deployment.md) - ⚠️ 已过时，基于单域名架构
- [**SSL 配置 (旧版)**](./ssl-setup.md) - ⚠️ 已过时，现使用 JC21 自动管理

## 🏗️ **系统架构**

### **当前生产环境 (2025.1.4+)**
```
Internet → JC21 Nginx Proxy Manager
    ├── daidai.amis.hk → Frontend (Vue 3 + Nginx)
    ├── api.daidai.amis.hk → API Server (Node.js + Express)
    └── directus.daidai.amis.hk → Directus CMS (管理后台)
```

### **技术栈**
- **前端**: Vue 3 + TypeScript + Vite + Three.js
- **后端**: Node.js + Express + Directus
- **数据库**: PostgreSQL
- **部署**: Docker Compose + JC21 Nginx Proxy Manager
- **SSL**: 自动 Let's Encrypt 证书管理

## 📖 **文档更新历史**

### **2025.1.4 - 架构重构**
- ✅ 迁移到多域名架构
- ✅ 使用 JC21 Nginx Proxy Manager
- ✅ 新增模型版本管理系统
- ✅ 优化用户界面和工作流程

### **历史架构 (已淘汰)**
- ❌ 单域名 + 路径代理方式
- ❌ 手动 Nginx + Certbot 配置
- ❌ 分离的语音动画和测试页面

## 🔍 **文档导航**

### **对于开发者**
1. [项目概述](../README.md) - 了解项目背景和功能
2. [前端文档](../frontend/README.md) - Vue 3 应用开发指南
3. [API 文档](./api-server.md) - 后端 API 接口说明
4. [更新日志](../CHANGELOG.md) - 最新功能和变更

### **对于运维人员**
1. [部署指南](../DEPLOYMENT.md) - 完整的生产环境部署
2. [故障排除](../DEPLOYMENT.md#故障排除) - 常见问题和解决方案
3. [维护操作](../DEPLOYMENT.md#维护操作) - 备份、更新、监控

### **对于产品人员**
1. [功能特性](../README.md#核心功能) - 产品功能概览
2. [用户界面](../frontend/README.md#用户界面与工作流程) - 用户体验设计
3. [版本历史](../CHANGELOG.md) - 产品迭代记录

## 📞 **技术支持**

- **问题反馈**: 通过 GitHub Issues 提交
- **文档更新**: 重要变更需同步更新相关文档
- **部署咨询**: 参考 [DEPLOYMENT.md](../DEPLOYMENT.md) 故障排除章节

---

**📌 注意**: 
- ⚠️ 标记为"已过时"的文档仅供历史参考，请以最新版本为准
- ✅ 定期检查文档更新，确保使用最新的部署和开发指南
- 🔄 文档持续改进中，欢迎提供反馈和建议
