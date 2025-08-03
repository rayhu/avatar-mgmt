# Avatar Management 部署指南

## 📋 **概述**

本文档描述了如何部署 Avatar Management 系统到生产环境。系统使用 Docker Compose 和 JC21 Nginx Proxy Manager 进行容器化部署。

## 🏗️ **系统架构**

```
用户请求 → JC21 Nginx Proxy Manager → 各服务容器
├── 前端 (Vue.js + Vite) → nginx:alpine
├── API服务 (Node.js + Express) → avatar-mgmt-api
├── 数据库 (PostgreSQL) → postgres:15
├── CMS (Directus) → directus/directus:11.8
└── 代理管理 (JC21) → jc21/nginx-proxy-manager
```

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

### **4. 配置JC21**

1. **访问管理界面**: http://daidai.amis.hk:81
2. **登录**: admin@example.com / changeme
3. **配置路径代理**:

#### **路径代理配置**
```
路径: /api/ → 转发到: api:3000
路径: /directus/ → 转发到: directus:8055
路径: / → 转发到: frontend:80
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

### **Docker Compose 配置**

主要服务配置在 `docker-compose.prod-simple.yml`:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: api-server/Dockerfile
    expose:
      - "3000"
    networks:
      - internal

  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
    expose:
      - "80"
    networks:
      - internal

  directus:
    image: directus/directus:11.8
    expose:
      - "8055"
    networks:
      - internal

  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    ports:
      - '80:80'
      - '443:443'
      - '81:81'
    volumes:
      - ./jc21/data:/data
      - ./jc21/letsencrypt:/etc/letsencrypt
    networks:
      - internal
```

## 🌐 **访问地址**

### **生产环境**
- **前端应用**: https://daidai.amis.hk
- **API服务**: https://daidai.amis.hk/api/health
- **Directus管理**: https://daidai.amis.hk/directus
- **JC21管理**: http://daidai.amis.hk:81

### **测试命令**
```bash
# 测试前端
curl -s -o /dev/null -w "%{http_code}" https://daidai.amis.hk

# 测试API
curl -s https://daidai.amis.hk/api/health

# 测试JC21管理界面
curl -s -o /dev/null -w "%{http_code}" http://daidai.amis.hk:81
```

## 🛠️ **故障排除**

### **常见问题**

1. **JC21路径代理不工作**
   - 检查nginx配置中的 `proxy_pass` 末尾是否有斜杠
   - 确保路径匹配正确

2. **API服务无法访问**
   - 检查容器是否正常运行: `docker ps`
   - 检查API健康状态: `curl http://api:3000/health`

3. **前端构建失败**
   - 清理node_modules: `rm -rf node_modules yarn.lock`
   - 重新安装: `yarn install`

4. **JC21登录问题**
   - 默认凭据: admin@example.com / changeme
   - 如需重置: 删除jc21数据目录重新部署

### **日志查看**

```bash
# 查看所有服务日志
./scripts/deploy/main.sh logs

# 查看特定服务日志
ssh daidai-singapore "cd /opt/avatar-mgmt && sudo docker compose logs api"
```

## 🔄 **维护操作**

### **备份数据**
```bash
./scripts/deploy/main.sh backup
```

### **重启服务**
```bash
./scripts/deploy/main.sh deploy --restart
```

### **更新部署**
```bash
./scripts/deploy/main.sh build --all
./scripts/deploy/main.sh deploy --sync
./scripts/deploy/main.sh deploy --restart
```

## 📋 **部署检查清单**

- [ ] 前端构建成功
- [ ] API镜像构建成功
- [ ] 代码同步到服务器
- [ ] Docker容器启动正常
- [ ] JC21配置正确
- [ ] 路径代理工作正常
- [ ] 所有服务可访问
- [ ] SSL证书配置（可选）

## 🎯 **最佳实践**

1. **使用模块化部署脚本** - 避免手动操作
2. **定期备份数据** - 保护重要配置
3. **监控服务状态** - 及时发现问题
4. **测试所有功能** - 确保部署成功
5. **记录配置变更** - 便于问题排查

---

**使用新的模块化部署系统，部署过程更加可靠和可维护！** 🚀 

域名规划
daidai.amis.hk - 前端应用
api.daidai.amis.hk - API 服务器
directus.daidai.amis.hk - Directus CMS

技术栈
反向代理: JC21 (Nginx Proxy Manager)
SSL: 自动 Let's Encrypt 证书
前端: Vite 预览模式 (生产构建)
后端: Node.js 开发模式
数据库: Directus 容器


域名分离: 清晰的服务边界，便于管理和扩展
SSL 自动化: JC21 自动处理证书更新
开发效率: 后端保持开发模式，便于调试和热重载
生产级前端: 使用构建版本，性能优化
容器化: Directus 容器化部署，便于维护

前端配置
当前 api.ts 中生产环境配置已经正确
