# 部署指南

本文档详细说明数字人管理系统的部署流程，包括开发环境、生产环境和 SSL 配置。

## 部署选项

### 1. 云平台部署 (推荐)

#### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署到 Vercel
npx vercel --prod
```

**优势**:
- 自动 HTTPS
- 全球 CDN
- 零配置部署
- 自动构建优化

### 2. 自托管部署

#### 开发环境
```bash
# 1. 克隆项目
git clone [repository-url]
cd avatar-mgmt

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 启动开发环境
docker compose -f docker-compose.dev.yml up -d --build

# 4. 启动前端开发服务器
cd frontend
yarn install
yarn dev
```

#### 生产环境 (HTTP)
```bash
# 1. 构建并启动生产服务
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# 2. 访问服务
# 前端: http://your-server-ip
# API: http://your-server-ip/api/avatars
# Directus: http://your-server-ip/directus/
```

#### 生产环境 (HTTPS + SSL)
```bash
# 1. 配置域名 DNS 解析到服务器 IP

# 2. 获取 SSL 证书
./init-letsencrypt.sh your-domain.com your-email@domain.com

# 3. 启动完整服务栈
docker compose -f docker-compose.prod.yml up -d

# 4. 访问服务
# 前端: https://your-domain.com
# API: https://your-domain.com/api/avatars
# Directus: https://your-domain.com/directus/
```

## 环境配置

### 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DB_CLIENT` | 数据库类型 | `postgres` |
| `DB_HOST` | 数据库主机 | `db` |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_DATABASE` | 数据库名 | `directus` |
| `DB_USER` | 数据库用户 | `directus` |
| `DB_PASSWORD` | 数据库密码 | `directus` |
| `KEY` | Directus 密钥 | `supersecretkey` |
| `SECRET` | Directus 密钥 | `supersecretsecret` |
| `ADMIN_EMAIL` | 管理员邮箱 | `admin@example.com` |
| `ADMIN_PASSWORD` | 管理员密码 | `admin1234` |
| `DIRECTUS_URL` | Directus 服务地址 | `http://directus:8055` |
| `DIRECTUS_TOKEN` | Directus API 令牌 | `auto-generated` |
| `AZURE_SPEECH_KEY` | Azure 语音服务密钥 | `your-azure-key` |
| `AZURE_SPEECH_REGION` | Azure 语音服务区域 | `westus2` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-...` |

### 配置文件

#### 开发环境
- `docker-compose.dev.yml` - 开发环境配置
- `.env` - 环境变量文件

#### 生产环境
- `docker-compose.prod.yml` - 生产环境配置
- `.env.prod` - 生产环境变量
- `nginx/nginx.conf` - Nginx 配置
- `nginx/nginx-init.conf` - 初始化配置

## 服务架构

### 开发环境架构
```
前端 (Vite Dev Server) → API Server → Directus → PostgreSQL
     ↓
http://localhost:5173
```

### 生产环境架构 (HTTP)
```
Internet → Nginx → API Server → Directus → PostgreSQL
         ↓
    http://your-server-ip
```

### 生产环境架构 (HTTPS)
```
Internet → Nginx (SSL) → API Server → Directus → PostgreSQL
         ↓
    https://your-domain.com
```

## 端口配置

| 服务 | 开发环境 | 生产环境 | 说明 |
|------|----------|----------|------|
| 前端 | 5173 | 80/443 | Vite Dev Server / Nginx |
| API | 3000 | 3000 | Node.js API Server |
| Directus | 8055 | 8055 | CMS 管理界面 |
| PostgreSQL | 54321 | 5432 | 数据库 |
| Nginx | - | 80/443 | 反向代理 |

## 数据持久化

### 本地数据目录
```
avatar-mgmt/
├── db_data/              # PostgreSQL 数据
├── directus/
│   ├── uploads/          # 上传文件
│   ├── extensions/       # Directus 扩展
│   └── schemas/          # 数据库架构
└── certbot/
    ├── conf/             # SSL 证书
    └── www/              # ACME 挑战文件
```

### 备份策略
```bash
#!/bin/bash
# 备份脚本示例
BACKUP_DIR="/backup/avatar-mgmt-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 备份数据库
docker compose -f docker-compose.prod.yml exec db pg_dump -U directus directus > $BACKUP_DIR/database.sql

# 备份文件
cp -r directus/uploads $BACKUP_DIR/
cp -r directus/schemas $BACKUP_DIR/

# 备份证书 (如果使用 SSL)
cp -r certbot/conf $BACKUP_DIR/

# 压缩备份
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR/
```

## 监控和维护

### 服务状态检查
```bash
# 查看所有服务状态
docker compose -f docker-compose.prod.yml ps

# 查看服务日志
docker compose -f docker-compose.prod.yml logs -f [service-name]

# 重启服务
docker compose -f docker-compose.prod.yml restart [service-name]
```

### 性能监控
```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 日志管理
```bash
# 查看 Nginx 访问日志
docker compose -f docker-compose.prod.yml logs nginx

# 查看 API 服务日志
docker compose -f docker-compose.prod.yml logs api

# 查看 Directus 日志
docker compose -f docker-compose.prod.yml logs directus
```

## 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 检查 Docker 服务状态
docker info

# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# 查看详细错误日志
docker compose -f docker-compose.prod.yml logs
```

#### 2. 数据库连接失败
```bash
# 检查数据库容器状态
docker compose -f docker-compose.prod.yml ps db

# 检查数据库日志
docker compose -f docker-compose.prod.yml logs db

# 测试数据库连接
docker compose -f docker-compose.prod.yml exec db psql -U directus -d directus -c "SELECT 1;"
```

#### 3. SSL 证书问题
```bash
# 检查证书状态
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# 手动续期证书
docker compose -f docker-compose.prod.yml exec certbot certbot renew

# 检查 Nginx 配置
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### 性能优化

#### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_avatars_name ON avatars(name);
CREATE INDEX idx_avatars_purpose ON avatars(purpose);

-- 分析表统计信息
ANALYZE avatars;
```

#### 2. Nginx 优化
```nginx
# 启用 gzip 压缩
gzip on;
gzip_types text/plain text/css application/javascript application/json;

# 静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 3. 容器优化
```yaml
# 限制容器资源使用
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 安全考虑

### 1. 网络安全
- 使用防火墙限制端口访问
- 配置 SSL/TLS 加密
- 启用安全响应头
- 实施速率限制

### 2. 数据安全
- 定期备份数据
- 加密敏感配置
- 使用强密码
- 限制数据库访问

### 3. 应用安全
- 及时更新依赖
- 扫描安全漏洞
- 监控异常访问
- 实施访问控制

## 扩展部署

### 1. 负载均衡
```yaml
# 使用 Traefik 进行负载均衡
version: '3.8'
services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

### 2. 数据库集群
```yaml
# PostgreSQL 主从复制
services:
  db-master:
    image: postgres:15
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directus
    volumes:
      - ./db_data_master:/var/lib/postgresql/data

  db-slave:
    image: postgres:15
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directus
    volumes:
      - ./db_data_slave:/var/lib/postgresql/data
```

### 3. 缓存层
```yaml
# 添加 Redis 缓存
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - ./redis_data:/data
```

## 相关文档

- [API Server 文档](./api-server.md)
- [SSL 配置文档](./ssl-setup.md)
- [Directus 文档](https://docs.directus.io/)
- [Docker Compose 文档](https://docs.docker.com/compose/) 
