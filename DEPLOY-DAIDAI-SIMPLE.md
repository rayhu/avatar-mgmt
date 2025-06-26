# 数字人管理系统简化部署指南

使用 Nginx Proxy Manager 进行反向代理和 SSL 管理，大大简化了配置复杂度。

## 🚀 快速开始

### 1. 一键部署

```bash
# 给脚本执行权限
chmod +x deploy-daidai-simple.sh

# 执行部署
./deploy-daidai-simple.sh
```

### 2. 访问管理界面

部署完成后，访问 Nginx Proxy Manager 管理界面：

- **URL**: `http://你的服务器IP:81`
- **邮箱**: `admin@example.com`
- **密码**: `changeme`

## 📋 配置步骤

### 步骤 1: 修改默认密码

1. 登录管理界面
2. 点击右上角用户图标
3. 修改默认密码

### 步骤 2: 添加代理主机

#### 2.1 配置 API 服务

1. 点击 "Hosts" → "Proxy Hosts" → "Add Proxy Host"
2. 填写配置：
   - **Domain Names**: `daidai.amis.hk`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `api`
   - **Forward Port**: `3000`
   - **Block Common Exploits**: ✅ 启用
   - **Websockets Support**: ✅ 启用

#### 2.2 配置 Directus 管理界面

1. 再次点击 "Add Proxy Host"
2. 填写配置：
   - **Domain Names**: `admin.daidai.amis.hk`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `directus`
   - **Forward Port**: `8055`
   - **Block Common Exploits**: ✅ 启用
   - **Websockets Support**: ✅ 启用

### 步骤 3: 配置 SSL 证书

#### 3.1 启用 Let's Encrypt

1. 在代理主机配置页面，点击 "SSL" 标签
2. 选择 "Request a new SSL Certificate"
3. 填写邮箱地址
4. 勾选 "I agree to the Let's Encrypt Terms of Service"
5. 点击 "Save"

#### 3.2 强制 HTTPS 重定向

1. 在 SSL 配置中启用 "Force SSL"
2. 启用 "HTTP/2 Support"
3. 保存配置

## 🔧 高级配置

### 自定义路径

如果需要使用路径而不是子域名，可以这样配置：

```
Domain: daidai.amis.hk
Path: /api
Forward: http://api:3000

Domain: daidai.amis.hk  
Path: /admin
Forward: http://directus:8055
```

### 添加自定义 Nginx 配置

在代理主机配置的 "Advanced" 标签中可以添加自定义 Nginx 配置。

## 📊 管理命令

```bash
# 查看服务状态
docker compose -f docker-compose.prod-simple.yml ps

# 查看日志
docker compose -f docker-compose.prod-simple.yml logs -f

# 重启服务
docker compose -f docker-compose.prod-simple.yml restart

# 停止服务
docker compose -f docker-compose.prod-simple.yml down

# 更新服务
docker compose -f docker-compose.prod-simple.yml pull
docker compose -f docker-compose.prod-simple.yml up -d
```

## 🔍 故障排除

### 1. 管理界面无法访问

```bash
# 检查容器状态
docker compose -f docker-compose.prod-simple.yml ps

# 查看日志
docker compose -f docker-compose.prod-simple.yml logs nginx-proxy-manager
```

### 2. SSL 证书申请失败

- 确保域名 DNS 解析正确
- 确保 80 和 443 端口开放
- 检查防火墙设置

### 3. 代理主机无法访问

- 检查目标服务是否正常运行
- 验证容器网络连接
- 查看 Nginx Proxy Manager 日志

## 🆚 与手动配置的对比

| 特性 | 手动 Nginx 配置 | Nginx Proxy Manager |
|------|----------------|-------------------|
| 配置复杂度 | 高 | 低 |
| SSL 证书管理 | 手动 | 自动 |
| 图形化界面 | 无 | 有 |
| 实时配置 | 需要重启 | 即时生效 |
| 学习成本 | 高 | 低 |
| 维护难度 | 高 | 低 |

## 📚 相关资源

- [Nginx Proxy Manager 官方文档](https://nginxproxymanager.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)

## 🎯 优势总结

使用 Nginx Proxy Manager 的主要优势：

1. **简化配置**: 图形化界面，无需手动编写 Nginx 配置
2. **自动 SSL**: 一键申请和续期 Let's Encrypt 证书
3. **实时生效**: 配置修改即时生效，无需重启
4. **易于维护**: 直观的管理界面，降低维护成本
5. **功能丰富**: 支持 WebSocket、HTTP/2、缓存等功能
6. **安全可靠**: 内置安全防护，自动阻止常见攻击

这种方式特别适合不想深入 Nginx 配置细节的开发者，让您专注于业务逻辑而不是基础设施配置。 
