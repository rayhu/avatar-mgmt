# 数字化身管理系统 - 完整部署指南

## 📋 目录

- [部署架构概览](#部署架构概览)
- [版本发布流程](#版本发布流程)
- [手动部署指南](#手动部署指南)
- [版本回滚操作](#版本回滚操作)
- [故障排除指南](#故障排除指南)
- [监控和健康检查](#监控和健康检查)
- [环境配置管理](#环境配置管理)
- [常见问题解答](#常见问题解答)

## 📋 系统概述

本文档描述了数字化身管理系统的完整部署方案，包括版本化构建、自动化部署、回滚操作和故障排除。系统采用现代化的 GitOps 流程，支持 Pre-release 测试和正式发布的完整生命周期管理。

## 🏗️ 部署架构概览

### 环境架构

```
📦 源代码 (GitHub)
    ↓
🔨 构建镜像 (GitHub Actions + GHCR)
    ↓
🧪 Staging 环境 ← Pre-release
🚀 Production 环境 ← Release
```

### 版本标签策略

```
Pre-release (v1.2.0-beta.1):
├── ghcr.io/rayhu/avatar-mgmt/api:v1.2.0-beta.1
├── ghcr.io/rayhu/avatar-mgmt/api:staging
├── ghcr.io/rayhu/avatar-mgmt/frontend:v1.2.0-beta.1
└── ghcr.io/rayhu/avatar-mgmt/frontend:staging

Release (v1.2.0):
├── ghcr.io/rayhu/avatar-mgmt/api:v1.2.0
├── ghcr.io/rayhu/avatar-mgmt/api:latest
├── ghcr.io/rayhu/avatar-mgmt/frontend:v1.2.0
└── ghcr.io/rayhu/avatar-mgmt/frontend:latest
```

### 服务架构

```
Internet
    ↓
JC21 Nginx Proxy Manager (ports: 80, 443, 81)
    ├── daidai.amis.hk → frontend:80 (nginx:alpine)
    ├── api.daidai.amis.hk → api:3000 (Node.js + Express)
    └── directus.daidai.amis.hk → directus:8055 (Directus CMS)
             ↓
Internal Network (bridge)
    ├── PostgreSQL Database (db:5432)
    ├── Nginx Proxy Manager DB (MariaDB)
    └── All services communicate internally
```

### 环境域名架构

**Staging 环境：**

- **主域名**: `daidai-preview.amis.hk` - 前端应用
- **API域名**: `api.daidai-preview.amis.hk` - API服务器
- **CMS域名**: `directus.daidai-preview.amis.hk` - Directus管理后台

**Production 环境：**

- **主域名**: `daidai.amis.hk` - 前端应用
- **API域名**: `api.daidai.amis.hk` - API服务器
- **CMS域名**: `directus.daidai.amis.hk` - Directus管理后台

## 🚀 版本发布流程

### 1. 开发到测试流程

```bash
# 1. 开发完成，合并到 main 分支
git checkout main
git pull origin main
git merge feature/your-feature

# 2. 创建 Pre-release 进行测试
# 在 GitHub 网页操作：
# - 访问：https://github.com/rayhu/avatar-mgmt/releases/new
# - Tag version: v1.2.0-beta.1
# - Release title: v1.2.0-beta.1 - 测试版本
# - ✅ 勾选 "This is a pre-release"
# - 点击 "Publish release"
```

**自动触发流程：**

1. 🔨 构建工作流自动启动
2. 🧪 构建完成后自动部署到 Staging 环境
3. 📧 Slack/Email 通知部署结果

### 2. 测试到生产流程

```bash
# 测试通过后，创建正式 Release
# 在 GitHub 网页操作：
# - 访问：https://github.com/rayhu/avatar-mgmt/releases/new
# - Tag version: v1.2.0
# - Release title: v1.2.0 - 正式发布
# - ❌ 不勾选 "This is a pre-release"
# - 填写 Release notes
# - 点击 "Publish release"
```

**自动触发流程：**

1. 🔨 构建工作流自动启动
2. 🚀 构建完成后自动部署到 Production 环境
3. 📧 Slack/Email 通知部署结果

## 🎛️ 手动部署指南

### 1. 通过 GitHub Actions 手动部署

1. **访问 Actions 页面**

   ```
   https://github.com/rayhu/avatar-mgmt/actions/workflows/manual-deploy.yml
   ```

2. **点击 "Run workflow"**

3. **选择部署参数**
   - **Environment**: `staging` 或 `production`
   - **Version**:
     - `latest` - 最新正式版本
     - `staging` - 最新测试版本
     - `v1.2.0` - 指定版本
   - **Force deploy**: 是否跳过验证

4. **点击 "Run workflow" 执行**

### 2. 命令行手动部署（服务器端）

```bash
# SSH 连接到目标服务器
ssh user@your-server.com

# 切换到部署目录
cd /opt/deploy-avatar  # Staging
cd /opt/deploy-avatar-prod  # Production

# 设置环境变量
export GITHUB_REPOSITORY="rayhu/avatar-mgmt"
export GITHUB_TOKEN="your_github_token"
export GITHUB_ACTOR="your_username"
export IMAGE_TAG="v1.2.0"  # 指定版本

# 执行部署
./deploy-ghcr.sh

# 执行健康检查
export DOCKER_COMPOSE_FILE="docker-compose.stage.yml"  # 或 prod.yml
./health-check.sh
```

## ⏪ 版本回滚操作

### 1. 快速回滚（推荐）

**通过 GitHub Actions 回滚：**

1. 访问 Manual Deployment 工作流
2. 选择环境和上一个稳定版本
3. 执行部署

**示例：**

```yaml
Environment: production
Version: v1.1.0 # 上一个稳定版本
Force deploy: false
```

### 2. 服务器端紧急回滚

```bash
# SSH 连接到服务器
ssh user@production-server.com

# 切换到部署目录
cd /opt/deploy-avatar-prod

# 查看可用的镜像版本
docker images | grep ghcr.io/rayhu/avatar-mgmt

# 停止当前服务
docker compose -f docker-compose.prod.yml down

# 修改环境变量指向上一个版本
export IMAGE_TAG="v1.1.0"

# 重新启动服务
docker compose -f docker-compose.prod.yml up -d

# 检查服务状态
docker compose -f docker-compose.prod.yml ps
```

### 3. 数据库回滚（谨慎操作）

```bash
# 如果需要回滚数据库（极少情况）
cd /opt/deploy-avatar-prod

# 停止所有服务
docker compose -f docker-compose.prod.yml down

# 恢复数据库备份（如果有）
# 注意：这会丢失回滚点之后的所有数据
docker run --rm -v avatar_db_data:/data -v /path/to/backup:/backup \
  postgres:15 sh -c "rm -rf /data/* && tar -xzf /backup/db-backup-$(date -d '1 day ago' +%Y%m%d).tar.gz -C /data"

# 重新启动服务
export IMAGE_TAG="v1.1.0"
docker compose -f docker-compose.prod.yml up -d
```

## 🔧 故障排除指南

### 1. 构建失败

**症状：** GitHub Actions 构建工作流失败

**检查步骤：**

```bash
# 1. 查看构建日志
# 访问：https://github.com/rayhu/avatar-mgmt/actions

# 2. 常见问题：
# - 代码语法错误
# - 依赖包安装失败
# - Docker 构建失败
# - 测试用例失败

# 3. 本地验证
cd frontend
yarn install
yarn build
yarn lint
yarn type-check

cd ../api-server
yarn install
yarn build
yarn test
```

### 2. 部署失败

**症状：** 部署工作流执行失败

**检查步骤：**

```bash
# 1. SSH 连接到服务器检查
ssh user@your-server.com

# 2. 查看 Docker 服务状态
docker compose -f docker-compose.stage.yml ps
docker compose -f docker-compose.stage.yml logs

# 3. 检查磁盘空间
df -h

# 4. 检查内存使用
free -h

# 5. 检查 Docker 日志
docker logs container_name

# 6. 清理 Docker 资源
docker system prune -f
docker volume prune -f
```

### 3. 服务启动失败

**症状：** 容器无法正常启动

**检查步骤：**

```bash
# 1. 查看容器状态
docker compose ps

# 2. 查看具体容器日志
docker compose logs api
docker compose logs frontend
docker compose logs directus
docker compose logs db

# 3. 检查配置文件
cat .env.stage.api
cat .env.stage.directus

# 4. 手动启动容器进行调试
docker run -it --rm ghcr.io/rayhu/avatar-mgmt/api:latest sh
```

### 4. 数据库连接问题

**症状：** API 无法连接到数据库

**解决步骤：**

```bash
# 1. 检查数据库容器状态
docker compose ps db

# 2. 检查数据库日志
docker compose logs db

# 3. 测试数据库连接
docker compose exec db psql -U directus -d directus -c "SELECT 1;"

# 4. 检查网络连接
docker compose exec api ping db

# 5. 重置数据库密码（如果需要）
docker compose exec db psql -U directus -d directus -c "ALTER USER directus PASSWORD 'new_password';"
```

### 5. 镜像拉取失败

**症状：** 无法从 GHCR 拉取镜像

**解决步骤：**

```bash
# 1. 检查 GHCR 登录状态
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin

# 2. 手动拉取镜像测试
docker pull ghcr.io/rayhu/avatar-mgmt/api:latest

# 3. 检查镜像是否存在
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/rayhu/avatar-mgmt/packages"

# 4. 清理 Docker 缓存
docker system prune -a -f
```

## 📊 监控和健康检查

### 1. 自动健康检查

系统内置健康检查脚本：

```bash
# 执行健康检查
./health-check.sh

# 检查内容：
# - 容器运行状态
# - API 响应测试
# - 数据库连接测试
# - 前端页面访问测试
```

### 2. 手动服务检查

```bash
# 检查所有服务状态
docker compose ps

# 检查资源使用情况
docker stats

# 检查服务健康状态
curl -f http://localhost:3000/health  # API 健康检查
curl -f http://localhost:8055/server/health  # Directus 健康检查

# 检查日志
docker compose logs --tail=50 api
docker compose logs --tail=50 frontend
```

### 3. 性能监控

```bash
# 查看系统资源
htop
iotop

# 查看 Docker 容器资源使用
docker stats --no-stream

# 查看磁盘使用
du -sh /opt/deploy-avatar*
df -h
```

## ⚙️ 环境配置管理

### 1. 配置文件位置

```
Staging 环境：
├── /opt/deploy-avatar/.env.stage.api
├── /opt/deploy-avatar/.env.stage.directus
└── /opt/deploy-avatar/docker-compose.stage.yml

Production 环境：
├── /opt/deploy-avatar-prod/.env.prod.api
├── /opt/deploy-avatar-prod/.env.prod.directus
└── /opt/deploy-avatar-prod/docker-compose.prod.yml
```

### 2. 配置文件模板

**.env.stage.api**

```env
NODE_ENV=staging
PORT=3000
DIRECTUS_URL=http://directus:8055
DIRECTUS_TOKEN=your_staging_directus_token
OPENAI_API_KEY=your_staging_openai_key
AZURE_SPEECH_KEY=your_staging_azure_key
AZURE_SPEECH_REGION=eastasia
```

**.env.prod.api**

```env
NODE_ENV=production
PORT=3000
DIRECTUS_URL=http://directus:8055
DIRECTUS_TOKEN=your_production_directus_token
OPENAI_API_KEY=your_production_openai_key
AZURE_SPEECH_KEY=your_production_azure_key
AZURE_SPEECH_REGION=eastasia
```

### 3. 安全配置检查

```bash
# 检查文件权限
ls -la .env.*.api .env.*.directus

# 确保配置文件不被 Git 跟踪
cat .gitignore | grep -E "\.env\."

# 检查敏感信息是否正确配置
grep -E "(TOKEN|KEY|PASSWORD)" .env.*.api .env.*.directus
```

## ❓ 常见问题解答

### Q1: 如何查看当前部署的版本？

```bash
# 方法1：查看运行中的容器镜像
docker compose ps --format "table {{.Service}}\t{{.Image}}"

# 方法2：通过 API 查询版本信息
curl http://localhost:3000/health | jq '.version'

# 方法3：查看容器标签
docker inspect $(docker compose ps -q api) | jq '.[0].Config.Labels'
```

### Q2: 如何清理旧的 Docker 镜像？

```bash
# 清理未使用的镜像
docker image prune -a -f

# 清理特定仓库的旧镜像
docker images | grep ghcr.io/rayhu/avatar-mgmt | grep -v latest | awk '{print $3}' | xargs docker rmi

# 清理所有 Docker 资源
docker system prune -a --volumes -f
```

### Q3: 如何备份和恢复数据？

```bash
# 备份数据库
docker compose exec db pg_dump -U directus -d directus > backup-$(date +%Y%m%d).sql

# 备份 Directus 文件
tar -czf directus-files-$(date +%Y%m%d).tar.gz directus/uploads/

# 恢复数据库
docker compose exec -T db psql -U directus -d directus < backup-20241220.sql

# 恢复 Directus 文件
tar -xzf directus-files-20241220.tar.gz
```

### Q4: 如何更新环境变量？

```bash
# 1. 编辑配置文件
nano .env.stage.api

# 2. 重启相关服务
docker compose restart api

# 3. 验证更新是否生效
docker compose logs api | tail -10
curl http://localhost:3000/health
```

### Q5: 如何处理端口冲突？

```bash
# 检查端口使用情况
netstat -tlnp | grep :80
netstat -tlnp | grep :3000
netstat -tlnp | grep :8055

# 修改 docker-compose.yml 中的端口映射
# 将 "80:80" 改为 "8080:80"

# 重新启动服务
docker compose down
docker compose up -d
```

### Q6: 如何查看工作流状态？

```bash
# 查看构建状态
# 访问：https://github.com/rayhu/avatar-mgmt/actions/workflows/build-images.yml

# 查看部署状态
# 访问：https://github.com/rayhu/avatar-mgmt/actions/workflows/deploy-staging.yml
# 访问：https://github.com/rayhu/avatar-mgmt/actions/workflows/deploy-production.yml

# 查看手动部署选项
# 访问：https://github.com/rayhu/avatar-mgmt/actions/workflows/manual-deploy.yml
```

### Q7: 如何创建 Pre-release 版本？

```bash
# 版本号命名规范：
# - v1.0.0-alpha.1  # Alpha 版本
# - v1.0.0-beta.1   # Beta 版本
# - v1.0.0-rc.1     # Release Candidate

# GitHub 操作：
# 1. 访问 Releases 页面
# 2. 点击 "Create a new release"
# 3. 输入版本标签（如 v1.2.0-beta.1）
# 4. ✅ 勾选 "This is a pre-release"
# 5. 填写描述信息
# 6. 点击 "Publish release"
```

### Q8: 如何监控部署进度？

```bash
# 方法1：GitHub Actions 页面实时查看
# 访问：https://github.com/rayhu/avatar-mgmt/actions

# 方法2：服务器端查看 Docker 日志
ssh user@server
docker compose logs -f

# 方法3：健康检查端点
curl -f https://api.daidai.amis.hk/health
curl -f https://directus.daidai.amis.hk/server/health
```

## 🚨 紧急联系信息

- **开发团队**: dev-team@yourcompany.com
- **运维团队**: ops-team@yourcompany.com
- **项目负责人**: project-lead@yourcompany.com

## 📚 相关文档

- [项目 README](./README.md)
- [开发指南](./CLAUDE.md)
- [API 文档](./api-server/README.md)
- [前端文档](./frontend/README.md)

---

**最后更新**: 2025-08-20 **文档版本**: 2.0.0 **维护者**: Ray Hu (@rayhu)
