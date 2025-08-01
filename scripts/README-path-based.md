# jc21 路径分离架构配置指南

这个文档说明如何使用路径分离架构来配置 jc21 反向代理，实现单域名多服务的访问。

## 🎯 架构设计

```
用户访问 → jc21 (Nginx) → 根据路径分发到不同服务
         ↓
    / → 前端静态页面 (frontend:80)
    /api/* → API 服务 (api:3000)
    /directus/* → Directus 服务 (directus:8055)
    /admin/* → Directus 管理界面 (directus:8055)
```

## 📋 路径映射表

| 路径 | 目标服务 | 容器 | 端口 | 说明 |
|------|----------|------|------|------|
| `/` | 前端静态页面 | `frontend` | 80 | Vue.js 应用 |
| `/api/*` | API 服务 | `api` | 3000 | 后端 API 接口 |
| `/directus/*` | Directus 服务 | `directus` | 8055 | CMS 服务 |
| `/admin/*` | Directus 管理界面 | `directus` | 8055 | CMS 管理界面 |

## 🚀 快速开始

### 1. 启动 jc21 服务

```bash
# 启动 jc21 服务
./scripts/deploy-jc21-docker.sh --start

# 或者使用 docker compose
docker compose -f docker-compose.prod-simple.yml up -d nginx-proxy-manager nginx-proxy-manager-db
```

### 2. 配置路径分离

#### 生产环境配置
```bash
# 使用默认域名 (daidai.amis.hk)
./scripts/configure-jc21-path-based.sh --create

# 使用自定义域名
DOMAIN=example.com ./scripts/configure-jc21-path-based.sh --create
```

#### 本地测试配置
```bash
# 使用默认本地域名 (localhost)
./scripts/configure-jc21-path-based.sh --create-local

# 使用自定义本地域名
LOCAL_DOMAIN=test.local ./scripts/configure-jc21-path-based.sh --create-local
```

### 3. 验证配置

```bash
# 查看配置
./scripts/configure-jc21-proxy.sh --list

# 测试服务
curl http://localhost/
curl http://localhost/api/health
curl http://localhost/directus/
curl http://localhost/admin/
```

## 🌐 访问地址

### 生产环境
- **前端应用**: `https://daidai.amis.hk`
- **API 服务**: `https://daidai.amis.hk/api`
- **Directus 服务**: `https://daidai.amis.hk/directus`
- **管理界面**: `https://daidai.amis.hk/admin`

### 本地测试
- **前端应用**: `http://localhost`
- **API 服务**: `http://localhost/api`
- **Directus 服务**: `http://localhost/directus`
- **管理界面**: `http://localhost/admin`

## ⚙️ 配置详解

### 1. 主代理主机配置

```nginx
# 主域名代理配置
server {
    listen 80;
    server_name daidai.amis.hk;
    
    # 前端静态页面 (默认路径)
    location / {
        proxy_pass http://frontend:80;
        try_files $uri $uri/ /index.html;
    }
    
    # API 服务
    location /api/ {
        proxy_pass http://api:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Directus 服务
    location /directus/ {
        proxy_pass http://directus:8055/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Directus 管理界面
    location /admin/ {
        proxy_pass http://directus:8055/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. 路径配置

在 jc21 中，路径配置通过 `proxy_host_locations` 表实现：

```sql
-- 主代理主机
INSERT INTO proxy_hosts (
    domain_names,
    forward_host,
    forward_port,
    forward_scheme
) VALUES (
    'daidai.amis.hk',
    'frontend',
    80,
    'http'
);

-- API 路径
INSERT INTO proxy_host_locations (
    proxy_host_id,
    path,
    forward_host,
    forward_port,
    forward_scheme
) VALUES (
    1,  -- 主代理主机 ID
    '/api',
    'api',
    3000,
    'http'
);

-- Directus 路径
INSERT INTO proxy_host_locations (
    proxy_host_id,
    path,
    forward_host,
    forward_port,
    forward_scheme
) VALUES (
    1,  -- 主代理主机 ID
    '/directus',
    'directus',
    8055,
    'http'
);
```

## 🔧 高级配置

### 1. 自定义 Nginx 配置

在 jc21 管理界面中，可以在代理主机的 "Advanced" 标签中添加自定义配置：

```nginx
# API 特定配置
location /api/ {
    proxy_pass http://api:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 超时配置
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
    
    # 文件上传限制
    client_max_body_size 10M;
    
    # CORS 配置
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
}

# Directus 特定配置
location /directus/ {
    proxy_pass http://directus:8055/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 超时配置
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
    
    # 文件上传限制 (Directus 需要更大的限制)
    client_max_body_size 50M;
}

# 前端静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. SSL 配置

在生产环境中，建议启用 SSL：

1. 在 jc21 管理界面中，选择代理主机
2. 点击 "SSL" 标签
3. 选择 "Request a new SSL Certificate"
4. 填写邮箱地址
5. 勾选 "I agree to the Let's Encrypt Terms of Service"
6. 启用 "Force SSL" 和 "HTTP/2 Support"

### 3. 错误页面配置

```nginx
# 自定义错误页面
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location = /404.html {
    root /usr/share/nginx/html;
    internal;
}

location = /50x.html {
    root /usr/share/nginx/html;
    internal;
}
```

## 🔍 故障排除

### 1. 路径不匹配

**症状**: 访问 `/api` 返回 404

**解决方案**:
```bash
# 检查路径配置
./scripts/configure-jc21-proxy.sh --list

# 检查 Nginx 配置
docker compose -f docker-compose.prod-simple.yml exec nginx-proxy-manager nginx -t

# 重新加载配置
docker compose -f docker-compose.prod-simple.yml exec nginx-proxy-manager nginx -s reload
```

### 2. 服务无法访问

**症状**: 代理到后端服务失败

**解决方案**:
```bash
# 检查容器状态
docker compose -f docker-compose.prod-simple.yml ps

# 检查容器网络
docker compose -f docker-compose.prod-simple.yml exec nginx-proxy-manager ping api

# 检查服务日志
docker compose -f docker-compose.prod-simple.yml logs api
docker compose -f docker-compose.prod-simple.yml logs directus
```

### 3. SSL 证书问题

**症状**: SSL 证书申请失败

**解决方案**:
```bash
# 检查域名解析
nslookup daidai.amis.hk

# 检查端口开放
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# 检查防火墙
sudo ufw status
```

## 📊 监控和维护

### 1. 健康检查

```bash
# 检查服务状态
./scripts/deploy-jc21-docker.sh --status

# 检查配置
./scripts/configure-jc21-proxy.sh --list

# 查看日志
./scripts/deploy-jc21-docker.sh --logs
```

### 2. 备份和恢复

```bash
# 备份配置
./scripts/deploy-jc21-docker.sh --backup

# 恢复配置
./scripts/deploy-jc21-docker.sh --restore ./jc21/data/database-backup-20250101-120000.sqlite
```

### 3. 性能优化

```nginx
# 启用 gzip 压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# 启用缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🎯 最佳实践

### 1. 路径设计

- 使用清晰的路径前缀区分服务
- 避免路径冲突
- 考虑 API 版本控制 (如 `/api/v1/`)

### 2. 安全配置

- 启用 SSL 强制重定向
- 配置适当的访问控制
- 启用安全头设置

### 3. 性能优化

- 配置静态文件缓存
- 启用 gzip 压缩
- 设置适当的超时时间

### 4. 监控和日志

- 配置访问日志
- 监控服务健康状态
- 设置错误告警

## 📚 相关资源

- [jc21/nginx-proxy-manager 文档](https://nginxproxymanager.com/)
- [Nginx 路径代理配置](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Docker Compose 网络配置](https://docs.docker.com/compose/networking/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个配置方案！ 
