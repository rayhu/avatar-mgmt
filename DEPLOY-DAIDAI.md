# 🚀 部署到 daidai.amis.hk

本指南将帮助您将数字人管理系统部署到 `daidai.amis.hk` 域名。

## 📋 前置条件

### 1. 服务器要求
- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 8+)
- **内存**: 至少 2GB RAM
- **存储**: 至少 10GB 可用空间
- **网络**: 80 和 443 端口可访问

### 2. 软件要求
- Docker 20.10+
- Docker Compose 2.0+
- Git

### 3. 域名配置
确保 `daidai.amis.hk` 已正确解析到您的服务器 IP：
```bash
# 检查域名解析
nslookup daidai.amis.hk
dig daidai.amis.hk
```

## 🚀 快速部署

### 方法一：使用自动化脚本（推荐）

```bash
# 1. 克隆项目到服务器
git clone [repository-url]
cd avatar-mgmt

# 2. 修改邮箱地址（可选）
# 编辑 deploy-daidai.sh 文件，将 EMAIL 变量改为您的邮箱

# 3. 运行部署脚本
./deploy-daidai.sh
```

### 方法二：手动部署

```bash
# 1. 克隆项目
git clone [repository-url]
cd avatar-mgmt

# 2. 检查环境配置
ls -la .env.prod

# 3. 创建必要目录
mkdir -p certbot/conf certbot/www
mkdir -p directus/uploads directus/extensions directus/schemas

# 4. 构建镜像
docker compose -f docker-compose.prod.yml build --no-cache

# 5. 获取 SSL 证书
./init-letsencrypt.sh daidai.amis.hk your-email@domain.com

# 6. 启动服务
docker compose -f docker-compose.prod.yml up -d
```

## 🔧 配置说明

### 环境变量
项目使用 `.env.prod` 文件配置环境变量，主要包含：

- **数据库配置**: PostgreSQL 连接信息
- **Directus 配置**: CMS 管理平台设置
- **API 密钥**: Azure Speech 和 OpenAI 服务密钥
- **管理员账户**: 默认管理员登录信息

### 服务端口
| 服务 | 内部端口 | 外部端口 | 说明 |
|------|----------|----------|------|
| Nginx | 80, 443 | 80, 443 | 反向代理，SSL 终止 |
| API Server | 3000 | - | 后端 API 服务 |
| Directus | 8055 | - | 内容管理系统 |
| PostgreSQL | 5432 | - | 数据库 |

## 🌐 访问地址

部署完成后，您可以通过以下地址访问：

- **前端应用**: https://daidai.amis.hk
- **API 接口**: https://daidai.amis.hk/api/avatars
- **管理后台**: https://daidai.amis.hk/directus/

## 🔐 登录信息

### 前端登录
- **用户名**: admin
- **密码**: admin123

### Directus 管理后台
- **邮箱**: admin@example.com
- **密码**: admin1234

## 📊 服务管理

### 查看服务状态
```bash
docker compose -f docker-compose.prod.yml ps
```

### 查看服务日志
```bash
# 查看所有服务日志
docker compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f directus
```

### 重启服务
```bash
# 重启所有服务
docker compose -f docker-compose.prod.yml restart

# 重启特定服务
docker compose -f docker-compose.prod.yml restart nginx
```

### 停止服务
```bash
docker compose -f docker-compose.prod.yml down
```

## 🔒 SSL 证书管理

### 查看证书状态
```bash
docker compose -f docker-compose.prod.yml exec certbot certbot certificates
```

### 手动续期证书
```bash
docker compose -f docker-compose.prod.yml exec certbot certbot renew
```

### 证书自动续期
Certbot 容器会自动每 12 小时检查证书有效期，到期前自动续期。

## 🛠 故障排除

### 常见问题

#### 1. 部署脚本执行失败
```bash
# 检查脚本权限
chmod +x deploy-daidai.sh

# 检查 Docker 服务状态
sudo systemctl status docker

# 检查磁盘空间
df -h
```

#### 2. SSL 证书获取失败
```bash
# 检查域名解析
nslookup daidai.amis.hk

# 检查端口连通性
telnet daidai.amis.hk 80

# 查看 certbot 日志
docker compose -f docker-compose.prod.yml logs certbot
```

#### 3. 服务启动失败
```bash
# 查看详细错误日志
docker compose -f docker-compose.prod.yml logs

# 检查端口占用
netstat -tulpn | grep -E ':80|:443|:3000|:8055'

# 检查容器状态
docker ps -a
```

#### 4. 数据库连接失败
```bash
# 检查数据库容器
docker compose -f docker-compose.prod.yml ps db

# 测试数据库连接
docker compose -f docker-compose.prod.yml exec db psql -U directus -d directus -c "SELECT 1;"
```

## 📈 性能优化

### 1. 资源限制
```yaml
# 在 docker-compose.prod.yml 中添加资源限制
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### 2. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_avatars_name ON avatars(name);
CREATE INDEX idx_avatars_purpose ON avatars(purpose);
```

### 3. 缓存配置
```nginx
# 在 nginx.conf 中启用缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔄 更新部署

### 更新代码
```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
./deploy-daidai.sh
```

### 数据备份
```bash
# 备份数据库
docker compose -f docker-compose.prod.yml exec db pg_dump -U directus directus > backup.sql

# 备份上传文件
tar -czf uploads-backup.tar.gz directus/uploads/

# 备份证书
tar -czf certbot-backup.tar.gz certbot/conf/
```

## 📞 技术支持

如果遇到问题，请：

1. 查看服务日志获取错误信息
2. 检查 [SSL 配置文档](./docs/ssl-setup.md)
3. 参考 [部署指南](./docs/deployment.md)
4. 查看 [故障排除章节](#故障排除)

## 🎯 部署检查清单

- [ ] 域名 DNS 解析正确
- [ ] 服务器端口 80/443 开放
- [ ] Docker 和 Docker Compose 已安装
- [ ] 环境配置文件 `.env.prod` 存在
- [ ] SSL 证书获取成功
- [ ] 所有服务启动正常
- [ ] 前端应用可访问
- [ ] API 接口响应正常
- [ ] 管理后台可登录
- [ ] 数据库连接正常

---

**部署完成后，您的数字人管理系统将在 https://daidai.amis.hk 上运行！** 🎉 
