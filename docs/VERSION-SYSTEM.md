# 🔧 版本系统使用指南

## 📋 概述

本版本系统为 Avatar Management 项目提供完整的版本追踪功能，包括前端、后端和系统的版本信息、Git 提交记录、构建时间和运行状态。

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端版本信息   │    │   后端版本信息   │    │   系统版本信息   │
│                 │    │                 │    │                 │
│ • 版本号        │    │ • 版本号        │    │ • 环境标识      │
│ • Commit Hash   │    │ • Commit Hash   │    │ • 部署时间      │
│ • 构建时间      │    │ • 构建时间      │    │ • 运行时间      │
│ • Git 分支      │    │ • Git 分支      │    │ • 部署ID        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   版本API端点    │
                    │                 │
                    │ GET /api/version│
                    └─────────────────┘
```

## 🚀 快速开始

### 1. 生成版本信息

```bash
# 生成版本信息
./scripts/deploy/version.sh generate

# 或者使用部署脚本
./scripts/deploy/main.sh version generate
```

### 2. 查看版本信息

```bash
# 访问前端页面
http://localhost:3000/version

# 访问API端点
curl http://localhost:3000/api/version
```

### 3. 部署时自动生成

```bash
# 构建时自动生成版本信息
./scripts/deploy/main.sh build --all

# 部署时自动生成版本信息
./scripts/deploy/main.sh version deploy
```

## 📁 文件结构

```
project/
├── scripts/
│   ├── deploy/
│   │   ├── version.sh          # 版本管理脚本
│   │   └── main.sh             # 主部署脚本
│   └── generate-version.sh     # 简单版本生成脚本
├── frontend/
│   ├── public/
│   │   └── version/            # 前端版本信息
│   │       ├── frontend.json   # 前端版本
│   │       ├── backend.json    # 后端版本
│   │       ├── system.json     # 系统信息
│   │       └── full.json       # 完整版本信息
│   └── src/
│       ├── components/
│       │   └── VersionInfo.vue # 版本信息组件
│       └── views/
│           └── VersionInfo.vue # 版本信息页面
├── api-server/
│   ├── handlers/
│   │   └── version.ts          # 版本API处理器
│   └── version/                # 后端版本信息
│       ├── frontend.json
│       ├── backend.json
│       ├── system.json
│       └── full.json
└── version.json                 # 根目录版本信息
```

## 🔧 脚本命令

### 版本管理脚本 (`scripts/deploy/version.sh`)

```bash
# 生成版本信息
./scripts/deploy/version.sh generate

# 清理版本信息
./scripts/deploy/version.sh clean

# 部署版本信息
./scripts/deploy/version.sh deploy

# 显示帮助
./scripts/deploy/version.sh help
```

### 环境变量

```bash
# 设置环境
export NODE_ENV=production

# 设置部署ID
export DEPLOYMENT_ID=deploy_$(date +%s)

# 生成版本信息
./scripts/deploy/version.sh deploy
```

## 🌐 前端使用

### 1. 版本信息组件

```vue
<template>
  <VersionInfo />
</template>

<script setup>
import VersionInfo from '@/components/VersionInfo.vue'
</script>
```

### 2. 版本信息页面

访问 `/version` 路由查看完整的版本信息页面。

### 3. 自定义样式

组件使用 CSS Grid 布局，支持响应式设计：

```css
.version-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
```

## 🔌 API 使用

### 版本信息端点

```http
GET /api/version
```

### 响应格式

```json
{
  "frontend": {
    "version": "2024.01.15-abc123",
    "commitHash": "abc123",
    "buildTime": "2024-01-15T10:30:00Z",
    "branch": "main",
    "commitDate": "2024-01-15T10:30:00Z",
    "gitTag": "v1.0.0"
  },
  "backend": {
    "version": "2024.01.15-abc123",
    "commitHash": "abc123",
    "buildTime": "2024.01.15T10:30:00Z",
    "branch": "main",
    "commitDate": "2024-01-15T10:30:00Z",
    "gitTag": "v1.0.0"
  },
  "system": {
    "deployTime": "2024-01-15T10:30:00Z",
    "environment": "production",
    "uptime": "3600s",
    "deploymentId": "deploy_1705312200",
    "lastCheck": "2024-01-15T11:30:00Z"
  },
  "api": {
    "endpoint": "/api/version",
    "timestamp": "2024-01-15T11:30:00Z",
    "uptime": "3600s"
  },
  "generatedAt": "2024-01-15T10:30:00Z",
  "deploymentInfo": {
    "deploymentId": "deploy_1705312200",
    "deploymentTime": "2024-01-15T10:30:00Z",
    "deploymentUser": "deploy",
    "deploymentHost": "server-01"
  }
}
```

## 🧪 测试

### 运行版本系统测试

```bash
# 运行版本API测试
cd api-server
yarn test tests/handlers/version.test.ts

# 运行所有测试
yarn test
```

### 测试覆盖

- ✅ 版本信息生成
- ✅ 版本文件读取
- ✅ 默认版本信息
- ✅ 错误处理
- ✅ API 响应格式

## 🔄 部署集成

### 1. 构建时自动生成

在 `scripts/deploy/modules/build.sh` 中已集成版本管理：

```bash
# 构建完成后自动生成版本信息
build_frontend() {
    # ... 构建逻辑 ...
    
    # 生成版本信息
    log_info "生成版本信息..."
    if [ -f "scripts/deploy/version.sh" ]; then
        chmod +x scripts/deploy/version.sh
        ./scripts/deploy/version.sh deploy
    fi
}
```

### 2. 部署时自动生成

在 `scripts/deploy/main.sh` 中已集成版本管理：

```bash
# 版本管理命令
version)
    source "$MODULES_DIR/version.sh"
    main "$@"
    ;;
```

## 🚨 故障排查

### 常见问题

1. **版本信息显示"未知"**
   - 检查网络连接
   - 确认后端服务运行正常
   - 检查版本文件是否存在

2. **前后端版本不一致**
   - 重新生成版本信息
   - 检查构建流程
   - 确认部署同步

3. **Git 信息获取失败**
   - 确认在 Git 仓库中
   - 检查 Git 权限
   - 验证 Git 配置

### 调试命令

```bash
# 检查版本文件
ls -la frontend/public/version/
ls -la api-server/version/

# 查看版本内容
cat version.json | jq '.'

# 测试版本API
curl -v http://localhost:3000/api/version
```

## 📈 最佳实践

### 1. 版本号命名

- 使用语义化版本号：`v1.0.0`
- 开发版本：`2024.01.15-abc123`
- 预发布版本：`v1.0.0-beta.1`

### 2. 部署流程

```bash
# 1. 生成版本信息
./scripts/deploy/version.sh generate

# 2. 构建应用
./scripts/deploy/main.sh build --all

# 3. 部署到服务器
./scripts/deploy/main.sh deploy --full

# 4. 验证版本信息
curl http://your-domain.com/api/version
```

### 3. 监控和告警

- 定期检查版本一致性
- 监控部署时间
- 设置版本变更通知

## 🔮 未来扩展

### 计划功能

- [ ] 版本比较功能
- [ ] 自动回滚检测
- [ ] 版本变更日志
- [ ] 性能指标集成
- [ ] 多环境版本管理

### 贡献指南

欢迎提交 Issue 和 Pull Request 来改进版本系统！

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [API 文档](./api-server.md)
- [前端开发指南](./frontend/README.md)

---

**最后更新**: 2024-01-15  
**维护者**: 开发团队  
**版本**: 1.0.0
