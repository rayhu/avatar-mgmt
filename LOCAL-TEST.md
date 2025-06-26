# 本地测试指南 - Nginx Proxy Manager

在笔记本电脑上测试 Nginx Proxy Manager 的完整指南。

## 🖥️ 本地测试环境

### 适用场景
- 在个人笔记本电脑上测试 Nginx Proxy Manager
- 没有真实域名的开发环境
- 学习和熟悉 Nginx Proxy Manager 的使用

### 系统要求
- macOS / Linux / Windows (WSL2)
- Docker Desktop
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

## 🚀 快速开始

### 1. 一键启动本地测试环境

```bash
# 给脚本执行权限（如果还没有）
chmod +x test-local.sh

# 启动本地测试环境
./test-local.sh
```

### 2. 访问管理界面

启动完成后，访问 Nginx Proxy Manager 管理界面：

- **URL**: `http://localhost:81`
- **邮箱**: `admin@example.com`
- **密码**: `changeme`

## 📋 本地测试配置步骤

### 步骤 1: 修改默认密码

1. 登录管理界面
2. 点击右上角用户图标
3. 修改默认密码

### 步骤 2: 配置 API 服务代理

1. 点击 "Hosts" → "Proxy Hosts" → "Add Proxy Host"
2. 填写配置：
   - **Domain Names**: `localhost`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `api`
   - **Forward Port**: `3000`
   - **Block Common Exploits**: ✅ 启用
   - **Websockets Support**: ✅ 启用

### 步骤 3: 配置 Directus 管理界面

1. 再次点击 "Add Proxy Host"
2. 填写配置：
   - **Domain Names**: `localhost`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `directus`
   - **Forward Port**: `8055`
   - **Block Common Exploits**: ✅ 启用
   - **Websockets Support**: ✅ 启用

### 步骤 4: 配置路径代理（可选）

如果需要使用路径而不是端口，可以这样配置：

```
Domain: localhost
Path: /api
Forward: http://api:3000

Domain: localhost  
Path: /admin
Forward: http://directus:8055
```

## ⚠️ 重要注意事项

### 1. 端口冲突

脚本会自动检查以下端口是否被占用：
- `80` - HTTP
- `443` - HTTPS
- `81` - Nginx Proxy Manager 管理界面
- `3000` - API 服务
- `8055` - Directus

如果端口被占用，建议：
- 停止占用端口的服务
- 或修改 `docker-compose.local-test.yml` 中的端口映射

### 2. SSL 证书

**本地测试时不要申请 SSL 证书**：
- Let's Encrypt 需要真实的域名
- 本地测试使用 HTTP 即可
- 避免证书验证失败

### 3. 域名配置

- 使用 `localhost` 而不是真实域名
- 不要配置 SSL 证书
- 这是测试环境，不要用于生产

### 4. 资源使用

- 确保有足够的内存和磁盘空间
- 首次启动可能需要较长时间下载镜像
- 建议在空闲时进行测试

## 🔧 访问地址

### 通过 Nginx Proxy Manager 代理
- **API 服务**: `http://localhost` (通过代理)
- **Directus**: `http://localhost` (通过代理)

### 直接访问（绕过代理）
- **Directus**: `http://localhost:8055`
- **API 服务**: `http://localhost:3000` (如果暴露端口)

## 📊 管理命令

```bash
# 查看服务状态
docker compose -f docker-compose.local-test.yml ps

# 查看日志
docker compose -f docker-compose.local-test.yml logs -f

# 重启服务
docker compose -f docker-compose.local-test.yml restart

# 停止服务
docker compose -f docker-compose.local-test.yml down

# 完全清理（删除数据）
docker compose -f docker-compose.local-test.yml down -v
rm -rf data db_data directus/uploads
```

## 🔍 故障排除

### 1. 管理界面无法访问

```bash
# 检查容器状态
docker compose -f docker-compose.local-test.yml ps

# 查看日志
docker compose -f docker-compose.local-test.yml logs nginx-proxy-manager
```

### 2. 端口被占用

```bash
# 查看端口占用
lsof -i :80
lsof -i :443
lsof -i :81

# 停止占用端口的服务
sudo lsof -ti:80 | xargs kill -9
```

### 3. 内存不足

```bash
# 查看 Docker 资源使用
docker stats

# 清理 Docker 缓存
docker system prune -a
```

### 4. 服务启动失败

```bash
# 查看所有服务日志
docker compose -f docker-compose.local-test.yml logs

# 重新构建
docker compose -f docker-compose.local-test.yml build --no-cache
```

## 🧹 清理环境

### 完全清理

```bash
# 停止所有服务并删除数据
docker compose -f docker-compose.local-test.yml down -v

# 删除所有数据目录
rm -rf data db_data directus/uploads letsencrypt

# 清理 Docker 镜像（可选）
docker rmi $(docker images -q jc21/nginx-proxy-manager)
docker rmi $(docker images -q jc21/mariadb-aria)
```

### 部分清理

```bash
# 只停止服务，保留数据
docker compose -f docker-compose.local-test.yml down

# 只删除特定数据
rm -rf data/mysql
```

## 🎯 测试建议

1. **循序渐进**: 先熟悉基本功能，再测试高级特性
2. **记录配置**: 记录成功的配置步骤，便于复现
3. **备份数据**: 重要的测试数据及时备份
4. **定期清理**: 定期清理不需要的测试数据
5. **学习文档**: 参考 Nginx Proxy Manager 官方文档

## 📚 相关资源

- [Nginx Proxy Manager 官方文档](https://nginxproxymanager.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [本地开发最佳实践](https://docs.docker.com/desktop/)

## 🎉 总结

本地测试是学习和熟悉 Nginx Proxy Manager 的最佳方式。通过这个测试环境，您可以：

1. 熟悉图形化界面操作
2. 学习代理主机配置
3. 理解反向代理原理
4. 为生产环境部署做准备

记住，这是测试环境，不要用于生产部署！ 
