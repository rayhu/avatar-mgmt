# SSL 证书配置

该文档说明如何为数字人管理系统配置 Let's Encrypt SSL 证书，实现 HTTPS 安全访问。

## 概述

项目使用 **Nginx + Certbot** 方案实现 SSL 证书的自动获取和续期，支持生产环境的 HTTPS 访问。

## 架构设计

```
Internet → Nginx (SSL终止) → 内部服务
         ↓
    [80/443] → [3000] API Server
              → [8055] Directus
              → [静态文件] Frontend
```

## 前置条件

1. **域名**: 需要真实域名（不支持 IP 地址）
2. **DNS 配置**: 域名正确解析到服务器 IP
3. **端口开放**: 服务器的 80 和 443 端口可从互联网访问

## 快速配置

### 1. 域名准备

确保您的域名已正确配置 DNS 记录：

```bash
# 检查域名解析
nslookup your-domain.com
dig your-domain.com
```

### 2. 获取 SSL 证书

```bash
# 运行初始化脚本
./init-letsencrypt.sh your-domain.com your-email@domain.com

# 示例
./init-letsencrypt.sh avatar.example.com admin@example.com
```

### 3. 启动生产服务

```bash
# 启动完整服务栈
docker compose -f docker-compose.prod.yml up -d
```

## 配置详解

### 服务组件

| 服务 | 端口 | 说明 |
|------|------|------|
| nginx | 80, 443 | 反向代理，SSL 终止 |
| certbot | - | 证书自动续期 |
| api | 3000 | 后端 API 服务 |
| directus | 8055 | 内容管理系统 |
| db | 5432 | PostgreSQL 数据库 |

### 文件结构

```
avatar-mgmt/
├── certbot/
│   ├── conf/          # Let's Encrypt 证书存储
│   └── www/           # ACME 挑战文件
├── nginx/
│   ├── nginx.conf     # 生产环境 SSL 配置
│   └── nginx-init.conf # 初始化配置
├── docs/
│   └── ssl-setup.md   # 本文档
├── init-letsencrypt.sh # SSL 初始化脚本
└── docker-compose.prod.yml # 生产环境配置
```

## 安全特性

### SSL/TLS 配置

- **协议**: TLS 1.2 和 1.3
- **加密套件**: ECDHE-RSA-AES128-GCM-SHA256 等强加密
- **会话缓存**: 10 分钟会话复用
- **HSTS**: 强制 HTTPS 访问

### 安全头设置

```nginx
# 安全响应头
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 速率限制

```nginx
# API 端点限制
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=30 nodelay;

# Directus 端点限制  
limit_req_zone $binary_remote_addr zone=directus:10m rate=5r/s;
limit_req zone=directus burst=20 nodelay;
```

## 证书管理

### 自动续期

Certbot 容器每 12 小时自动检查证书有效期，到期前自动续期。

### 手动操作

```bash
# 查看证书状态
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# 手动续期
docker compose -f docker-compose.prod.yml exec certbot certbot renew

# 强制续期
docker compose -f docker-compose.prod.yml exec certbot certbot renew --force-renewal
```

### 证书备份

```bash
# 备份证书目录
tar -czf certbot-backup-$(date +%Y%m%d).tar.gz certbot/conf/

# 恢复证书
tar -xzf certbot-backup-20250101.tar.gz
```

## 路由配置

### HTTPS 路由表

| 路径 | 目标服务 | 说明 |
|------|----------|------|
| `/` | 静态文件 | 前端应用 |
| `/api/*` | API Server | 后端 API |
| `/directus/*` | Directus | 内容管理 |
| `/.well-known/acme-challenge/*` | Certbot | 证书验证 |

### HTTP 重定向

所有 HTTP 请求自动重定向到 HTTPS：

```nginx
location / {
    return 301 https://$host$request_uri;
}
```

## 故障排除

### 常见问题

#### 1. 证书获取失败

**症状**: `Failed to obtain SSL certificate`

**排查步骤**:
```bash
# 检查域名解析
nslookup your-domain.com

# 检查端口连通性
telnet your-domain.com 80

# 查看 certbot 日志
docker compose -f docker-compose.prod.yml logs certbot
```

**解决方案**:
- 确认 DNS 记录正确
- 检查防火墙设置
- 验证域名拼写

#### 2. Nginx 启动失败

**症状**: `nginx: [emerg] SSL certificate not found`

**排查步骤**:
```bash
# 检查证书文件
ls -la certbot/conf/live/your-domain.com/

# 验证 nginx 配置
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

**解决方案**:
- 重新运行初始化脚本
- 检查证书文件权限
- 验证配置文件语法

#### 3. SSL 连接错误

**症状**: 浏览器显示 SSL 错误

**排查步骤**:
```bash
# 检查证书有效期
openssl x509 -in certbot/conf/live/your-domain.com/cert.pem -text -noout

# 测试 SSL 连接
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### 日志查看

```bash
# Nginx 访问日志
docker compose -f docker-compose.prod.yml logs nginx

# Certbot 证书日志
docker compose -f docker-compose.prod.yml logs certbot

# 实时日志监控
docker compose -f docker-compose.prod.yml logs -f nginx certbot
```

## 性能优化

### 静态资源缓存

```nginx
# 长期缓存静态资源
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Gzip 压缩

```nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json application/xml+rss application/atom+xml image/svg+xml;
```

## 监控和维护

### 定期检查

- **证书有效期**: 每月检查一次
- **安全更新**: 定期更新 Docker 镜像
- **日志监控**: 监控错误和访问日志

### 备份策略

重要文件定期备份：

```bash
#!/bin/bash
# 备份脚本示例
BACKUP_DIR="/backup/ssl-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 备份证书
cp -r certbot/conf $BACKUP_DIR/

# 备份配置
cp nginx/nginx.conf $BACKUP_DIR/
cp .env.prod $BACKUP_DIR/

# 压缩备份
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR/
```

## 测试验证

### SSL 测试工具

- [SSL Labs](https://www.ssllabs.com/ssltest/) - 全面的 SSL 配置测试
- [Mozilla Observatory](https://observatory.mozilla.org/) - 安全头检查
- [Qualys SSL Test](https://www.ssllabs.com/ssltest/) - SSL 强度评估

### 本地测试

```bash
# 测试 HTTPS 连接
curl -I https://your-domain.com

# 测试 API 端点
curl https://your-domain.com/api/avatars

# 测试安全头
curl -I https://your-domain.com | grep -i security
```

## 注意事项

1. **开发环境**: SSL 配置仅适用于生产环境
2. **域名限制**: Let's Encrypt 不支持 IP 地址
3. **速率限制**: 避免频繁申请证书
4. **备份重要**: 定期备份证书和配置
5. **监控必要**: 设置证书过期提醒

## 相关文档

- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)
- [Certbot 用户指南](https://certbot.eff.org/docs/)
- [Nginx SSL 配置](https://nginx.org/en/docs/http/configuring_https_servers.html) 
