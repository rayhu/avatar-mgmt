# Avatar Management 部署指南

## 📋 **概述**

本文档描述了如何部署 Avatar Management 系统到生产环境。系统使用 Docker Compose 和 JC21 Nginx Proxy Manager 进行容器化部署，支持多域名配置和自动SSL证书管理。

## 🏗️ **系统架构**

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

### **生产环境域名架构**
- **主域名**: `daidai.amis.hk` - 前端应用
- **API域名**: `api.daidai.amis.hk` - API服务器
- **CMS域名**: `directus.daidai.amis.hk` - Directus管理后台

## 🚀 **快速部署**

### **1. 环境准备**

确保本地环境已安装：
- Node.js 22+
- Yarn 1.22+
- Docker & Docker Compose
- SSH 密钥配置

### **2. 构建项目**

```bash
# 构建前端
cd frontend && yarn install && yarn build

# 构建API镜像
docker build -t avatar-mgmt-api:latest -f api-server/Dockerfile .
```

### **3. 部署到服务器**

使用新的模块化部署系统：

```bash
# 完整部署流程
./scripts/deploy/main.sh build --all
./scripts/deploy/main.sh deploy --full
```

### **4. 配置JC21 Nginx Proxy Manager**

1. **访问管理界面**: http://daidai.amis.hk:81
2. **默认登录**: admin@example.com / changeme
3. **配置多域名代理**:

#### **域名代理配置（推荐）**
基于实际的docker-compose.prod.yml配置：

```yaml
# 主域名配置
daidai.amis.hk → forward to: frontend:80
- SSL: Enable (Let's Encrypt)
- Block Common Exploits: ✓
- Websockets Support: ✓

# API域名配置  
api.daidai.amis.hk → forward to: api:3000
- SSL: Enable (Let's Encrypt)
- Block Common Exploits: ✓
- Custom locations: /health, /api/*

# CMS域名配置
directus.daidai.amis.hk → forward to: directus:8055  
- SSL: Enable (Let's Encrypt)
- Block Common Exploits: ✓
- Websockets Support: ✓ (for real-time features)
```

#### **端口映射说明**
根据docker-compose.prod.yml的实际配置：
```yaml
ports:
  - "80:80"     # HTTP (JC21)
  - "443:443"   # HTTPS (JC21) 
  - "81:81"     # Admin UI (JC21)

Azure防火墙阻止以下端口，仅仅本机调试使用
  - "8055:8055" # Directus (direct access, optional)
  - "3000:3000" # API (direct access, optional)  
  - "4173:80"   # Frontend (direct access, optional)
```

#### **高级配置示例**
```nginx
location /api/ {
    proxy_pass http://api:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 📦 **模块化部署系统**

### **使用新的部署脚本**

```bash
# 查看帮助
./scripts/deploy/main.sh --help

# 构建组件
./scripts/deploy/main.sh build --frontend
./scripts/deploy/main.sh build --api
./scripts/deploy/main.sh build --all

# 部署到服务器
./scripts/deploy/main.sh deploy --full
./scripts/deploy/main.sh deploy --sync
./scripts/deploy/main.sh deploy --status

# 配置JC21
./scripts/deploy/main.sh config --configure
./scripts/deploy/main.sh config --test

# 维护操作
./scripts/deploy/main.sh logs
./scripts/deploy/main.sh status
./scripts/deploy/main.sh backup
```

### **环境变量配置**

```bash
export SERVER_HOST="daidai-singapore"
export REMOTE_DIR="/opt/avatar-mgmt"
export DOMAIN="daidai.amis.hk"
```

## 🔧 **服务配置**

### **Docker Compose 完整配置**

基于实际的 `docker-compose.prod.yml` 文件：

```yaml
version: "3.9"

services:
  # JC21 Nginx Proxy Manager - 主要的反向代理和SSL管理
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'        # HTTP
      - '443:443'      # HTTPS  
      - '81:81'        # Admin UI
    volumes:
      - ./jc21/data:/data
      - ./jc21/letsencrypt:/etc/letsencrypt
    networks:
      - internal
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:81"]

  # JC21的专用MariaDB数据库
  nginx-proxy-manager-db:
    image: 'jc21/mariadb-aria:latest'
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: 'npm'
      MYSQL_DATABASE: 'npm'
      MYSQL_USER: 'npm'  
      MYSQL_PASSWORD: 'npm'
    volumes:
      - ./jc21/data/mysql:/var/lib/mysql

  # PostgreSQL数据库 (用于Directus)
  db:
    image: postgres:15
    restart: always
    env_file:
      - .env.prod.directus
    environment:
      POSTGRES_DB: directus
    volumes:
      - ./db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U directus"]

  # Directus CMS
  directus:
    image: directus/directus:11.8
    restart: always
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env.prod.directus
    volumes:
      - ./directus/uploads:/directus/uploads
      - ./directus/extensions:/directus/extensions
      - ./directus/schemas:/directus/schemas
    ports:
      - "8055:8055"  # 可选的直接访问端口
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:8055/"]

  # API Server (自建)
  api:
    build:
      context: .
      dockerfile: api-server/Dockerfile
    restart: always
    depends_on:
      - directus
    env_file:
      - .env.prod.api
    ports:
      - "3000:3000"  # 可选的直接访问端口
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]

  # Frontend (Nginx静态文件服务)
  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./frontend/nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "4173:80"  # 可选的直接访问端口

networks:
  internal:
    driver: bridge
```

## 🌐 **访问地址**

### **生产环境 (多域名架构)**
- **前端应用**: https://daidai.amis.hk
- **API服务**: https://api.daidai.amis.hk
- **Directus管理**: https://directus.daidai.amis.hk  
- **JC21管理**: http://daidai.amis.hk:81

### **直接访问端口 (仅仅本地)**
- **前端直接访问**: http://daidai.amis.hk:4173
- **API直接访问**: http://daidai.amis.hk:3000
- **Directus直接访问**: http://daidai.amis.hk:8055

### **测试命令**
```bash
# 测试前端应用
curl -s -o /dev/null -w "%{http_code}" https://daidai.amis.hk
# 期望返回: 200

# 测试API服务
curl -s https://api.daidai.amis.hk/health
# 期望返回: "ok"

# 测试Directus CMS
curl -s -o /dev/null -w "%{http_code}" https://directus.daidai.amis.hk
# 期望返回: 200

# 测试JC21管理界面
curl -s -o /dev/null -w "%{http_code}" http://daidai.amis.hk:81
# 期望返回: 200

# 测试完整API端点
curl -s https://api.daidai.amis.hk/api/avatars
# 期望返回: JSON数组
```

### **健康检查端点**
```bash
# API健康状态
curl https://api.daidai.amis.hk/health

# Directus健康状态  
curl https://directus.daidai.amis.hk/server/ping
```

## 🛠️ **故障排除**

### **常见问题**

#### **1. 域名解析问题**
```bash
# 检查域名DNS解析
nslookup daidai.amis.hk
nslookup api.daidai.amis.hk  
nslookup directus.daidai.amis.hk

# 确保所有域名都指向同一服务器IP
```

#### **2. JC21配置问题**
```bash
# 检查JC21容器状态
docker compose -f docker-compose.prod.yml ps nginx-proxy-manager

# 检查JC21日志
docker compose -f docker-compose.prod.yml logs nginx-proxy-manager

# 重置JC21配置 (谨慎操作)
sudo rm -rf jc21/data && docker compose -f docker-compose.prod.yml restart nginx-proxy-manager
```

#### **3. 服务连接问题**
```bash
# 检查内部网络连通性
docker compose -f docker-compose.prod.yml exec nginx-proxy-manager ping frontend
docker compose -f docker-compose.prod.yml exec nginx-proxy-manager ping api
docker compose -f docker-compose.prod.yml exec nginx-proxy-manager ping directus

# 检查服务端口
docker compose -f docker-compose.prod.yml exec frontend netstat -tlnp
docker compose -f docker-compose.prod.yml exec api netstat -tlnp  
docker compose -f docker-compose.prod.yml exec directus netstat -tlnp
```

#### **4. SSL证书问题**
```bash
# 检查Let's Encrypt证书状态
docker compose -f docker-compose.prod.yml exec nginx-proxy-manager ls -la /etc/letsencrypt/live/

# 强制更新SSL证书 (在JC21管理界面操作)
# 1. 进入 http://daidai.amis.hk:81
# 2. SSL Certificates → 选择证书 → Renew
```

#### **5. 数据库连接问题**
```bash
# 检查PostgreSQL状态
docker compose -f docker-compose.prod.yml exec db pg_isready -U directus

# 检查MariaDB状态 (JC21)
docker compose -f docker-compose.prod.yml exec nginx-proxy-manager-db mysqladmin ping

# 检查Directus数据库连接
docker compose -f docker-compose.prod.yml logs directus | grep -i database
```

#### **6. 前端构建和缓存问题**
```bash
# 清理并重新构建前端
cd frontend
rm -rf node_modules yarn.lock dist
yarn install
yarn build

# 重启frontend容器
docker compose -f docker-compose.prod.yml restart frontend
```

### **日志查看**

```bash
# 查看所有服务日志
docker compose -f docker-compose.prod.yml logs

# 查看特定服务日志
docker compose -f docker-compose.prod.yml logs nginx-proxy-manager
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs api  
docker compose -f docker-compose.prod.yml logs directus
docker compose -f docker-compose.prod.yml logs db

# 实时跟踪日志
docker compose -f docker-compose.prod.yml logs -f api

# 查看最近的错误日志
docker compose -f docker-compose.prod.yml logs --tail=50 directus | grep -i error
```

## 🔄 **维护操作**

### **备份数据**
```bash
# 备份数据库架构
docker compose -f docker-compose.prod.yml exec directus npx directus schema snapshot schemas/backup-$(date +%Y%m%d).yml

# 备份PostgreSQL数据库
docker compose -f docker-compose.prod.yml exec db pg_dump -U directus directus > backup-db-$(date +%Y%m%d).sql

# 备份上传文件
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz directus/uploads/

# 备份JC21配置
tar -czf backup-jc21-$(date +%Y%m%d).tar.gz jc21/
```

### **重启服务**
```bash
# 重启所有服务
docker compose -f docker-compose.prod.yml restart

# 重启特定服务
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart directus
docker compose -f docker-compose.prod.yml restart nginx-proxy-manager

# 强制重新创建容器
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### **更新部署**
```bash
# 1. 停止服务
docker compose -f docker-compose.prod.yml down

# 2. 拉取最新代码
git pull origin main

# 3. 重新构建前端
cd frontend
yarn install  
yarn build
cd ..

# 4. 重新构建API镜像
docker compose -f docker-compose.prod.yml build api --no-cache

# 5. 启动服务
docker compose -f docker-compose.prod.yml up -d

# 6. 检查服务状态
docker compose -f docker-compose.prod.yml ps
```

### **数据库迁移**
```bash
# 应用数据库架构更新
docker compose -f docker-compose.prod.yml exec directus npx directus schema apply --yes schemas/snapshot.yml

# 检查迁移状态
docker compose -f docker-compose.prod.yml exec directus npx directus schema snapshot schemas/current-check.yml
```

## 📋 **部署检查清单**

### **基础环境**
- [ ] 服务器环境准备完成
- [ ] Docker & Docker Compose 已安装
- [ ] 域名DNS解析配置正确
- [ ] 防火墙端口开放 (80, 443, 81)

### **代码和构建**
- [ ] 最新代码已拉取
- [ ] 前端构建成功 (`yarn build`)
- [ ] API Docker镜像构建成功
- [ ] 环境变量文件配置正确

### **服务部署**
- [ ] 所有Docker容器启动正常
- [ ] 健康检查全部通过
- [ ] 数据库连接正常
- [ ] 内部网络通信正常

### **JC21代理配置**
- [ ] JC21管理界面可访问 (port 81)
- [ ] 多域名代理配置完成
- [ ] SSL证书自动获取成功
- [ ] 所有域名HTTPS访问正常

### **功能测试**
- [ ] 前端应用正常访问 (`https://daidai.amis.hk`)
- [ ] API服务正常响应 (`https://api.daidai.amis.hk/health`)
- [ ] Directus管理正常访问 (`https://directus.daidai.amis.hk`)
- [ ] 用户登录和基础功能正常

### **监控和备份**
- [ ] 日志记录正常
- [ ] 数据备份计划已设置
- [ ] 服务监控已配置
- [ ] 故障恢复流程已测试

## 🎯 **最佳实践**

### **🔒 安全实践**
1. **域名分离架构** - 清晰的服务边界，便于管理和扩展
2. **SSL自动化** - JC21自动处理Let's Encrypt证书更新
3. **内部网络隔离** - 所有服务在内部网络通信
4. **端口最小化暴露** - 仅必要端口对外开放

### **🚀 运维实践**
1. **定期备份** - 数据库、文件、配置的定期备份
2. **监控告警** - 服务状态和性能监控
3. **版本管理** - 代码和配置的版本控制
4. **文档维护** - 部署和运维文档的及时更新

### **📊 性能优化**
1. **生产级前端** - 使用构建版本，启用压缩和缓存
2. **容器化部署** - 便于维护、扩展和迁移
3. **健康检查** - 自动故障检测和恢复
4. **资源限制** - 合理的容器资源配置

---

## 🌍 **生产环境架构总结**

### **域名规划**
```
daidai.amis.hk      → 前端应用 (Vue.js + Nginx)
api.daidai.amis.hk  → API服务器 (Node.js + Express)  
directus.daidai.amis.hk → Directus CMS (管理后台)
```

### **技术栈**
- **反向代理**: JC21 Nginx Proxy Manager
- **SSL证书**: 自动 Let's Encrypt 证书管理
- **前端**: Vue 3 + Vite 生产构建 + Nginx
- **后端**: Node.js + Express + 自定义API
- **数据库**: PostgreSQL + Directus ORM
- **容器化**: Docker Compose 多服务编排

### **架构优势**
- ✅ **域名分离**: 清晰的服务边界和职责划分
- ✅ **SSL自动化**: 无需手动管理证书更新
- ✅ **高可用性**: 健康检查和自动重启机制
- ✅ **易于维护**: 容器化部署便于升级和迁移
- ✅ **安全可靠**: 内部网络隔离和最小权限原则

**🎉 使用多域名 + JC21的现代化部署架构，确保系统的可靠性和可维护性！**
