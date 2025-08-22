# 迁移指南

从旧版本架构迁移到多域名 + JC21 架构的完整指南。

⚠️ **重要**: 如果您是新部署，请直接参考
[DEPLOYMENT.md](../DEPLOYMENT.md)，无需阅读本迁移指南。

## 🔄 **架构变更概述**

### **从旧架构迁移**

```diff
- 旧架构: 单域名 + 路径代理
- domain.com/api/ → api:3000
- domain.com/directus/ → directus:8055
- domain.com/ → frontend:80

+ 新架构: 多域名 + JC21 管理
+ daidai.amis.hk → frontend:80
+ api.daidai.amis.hk → api:3000
+ directus.daidai.amis.hk → directus:8055
```

## 📋 **迁移前检查清单**

- [ ] 确认当前系统版本和数据完整性
- [ ] 备份现有数据库和文件
- [ ] 备份当前 Nginx 配置
- [ ] 确认新域名 DNS 解析正确
- [ ] 准备 3 个子域名: 主域名、api 子域名、directus 子域名

## 🚀 **自动迁移步骤**

### **1. 备份现有系统**

```bash
# 备份数据库架构
docker-compose exec directus npx directus schema snapshot schemas/backup-before-migration-$(date +%Y%m%d).yml

# 备份数据库数据
docker-compose exec db pg_dump -U directus directus > backup-db-$(date +%Y%m%d).sql

# 备份文件和配置
tar -czf backup-complete-$(date +%Y%m%d).tar.gz directus/uploads/ db_data/ nginx/

# 备份当前 docker-compose 配置
cp docker-compose.yml docker-compose-backup-$(date +%Y%m%d).yml
```

### **2. 拉取最新代码**

```bash
git pull origin main
```

### **3. 更新环境配置**

```bash
# 更新环境变量文件
cp .env.example .env.directus
cp .env.example .env.api

# 编辑环境变量，更新域名配置
# DIRECTUS_PUBLIC_URL=https://directus.daidai.amis.hk
# API_BASE_URL=https://api.daidai.amis.hk
```

### **4. 停止旧服务**

```bash
# 停止当前服务
docker-compose down
```

### **5. 部署新架构**

```bash
# 使用新的 docker-compose 配置
docker-compose -f docker-compose.prod.yml up -d

# 等待所有服务启动
docker-compose -f docker-compose.prod.yml ps
```

### **6. 配置 JC21 Nginx Proxy Manager**

1. **访问管理界面**: `http://your-server-ip:81`
2. **首次登录**: `admin@example.com` / `changeme`
3. **配置域名代理**:

```yaml
# 主域名
daidai.amis.hk → forward to: frontend:80
- SSL: ✅ Request new certificate
- Force SSL: ✅
- Block Common Exploits: ✅

# API域名
api.daidai.amis.hk → forward to: api:3000
- SSL: ✅ Request new certificate
- Force SSL: ✅

# CMS域名
directus.daidai.amis.hk → forward to: directus:8055
- SSL: ✅ Request new certificate
- Force SSL: ✅
- Websockets: ✅
```

### **7. 应用数据库迁移**

```bash
# 应用最新的数据库架构（版本管理系统）
sudo docker-compose -f docker-compose.db.yml exec directus npx directus schema apply --yes schemas/snapshot.yml
```

### **8. 更新前端配置**

```bash
# 重新构建前端（新的 API 域名配置）
cd frontend
yarn build
cd ..

# 重启前端容器
docker-compose -f docker-compose.prod.yml restart frontend
```

## ✅ **验证迁移成功**

### **1. 检查服务状态**

```bash
# 检查所有容器运行状态
docker-compose -f docker-compose.prod.yml ps

# 检查健康检查状态
docker-compose -f docker-compose.prod.yml exec nginx-proxy-manager curl -f http://localhost:81
```

### **2. 测试域名访问**

```bash
# 测试前端
curl -s -o /dev/null -w "%{http_code}" https://daidai.amis.hk
# 期望: 200

# 测试 API
curl -s https://api.daidai.amis.hk/health
# 期望: "ok"

# 测试 Directus
curl -s -o /dev/null -w "%{http_code}" https://directus.daidai.amis.hk
# 期望: 200
```

### **3. 功能测试**

- [ ] 用户登录正常
- [ ] 模型列表显示正常
- [ ] 版本信息正确显示
- [ ] 新的编辑功能正常
- [ ] 语音动画功能正常
- [ ] Directus 管理界面正常

## 🔧 **迁移后配置**

### **1. 清理旧配置**

```bash
# 移除旧的 Nginx 配置（如果有）
sudo rm -rf /etc/nginx/sites-available/avatar-mgmt
sudo rm -rf /etc/nginx/sites-enabled/avatar-mgmt

# 清理旧的证书文件（如果使用 Certbot）
sudo rm -rf /etc/letsencrypt/live/your-old-domain.com
```

### **2. 更新 DNS 记录**

确保以下 DNS 记录正确配置：

```
A    daidai.amis.hk      → your-server-ip
A    api.daidai.amis.hk  → your-server-ip
A    directus.daidai.amis.hk → your-server-ip
```

### **3. 更新防火墙规则**

```bash
# 确保必要端口开放
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 81/tcp   # JC21 Admin (可选，可限制 IP)

# 可选：限制 JC21 管理端口访问
sudo ufw allow from your-admin-ip to any port 81
```

## 🆘 **回滚计划**

如果迁移失败，可以回滚到旧架构：

```bash
# 1. 停止新服务
docker-compose -f docker-compose.prod.yml down

# 2. 恢复旧配置
cp docker-compose-backup-YYYYMMDD.yml docker-compose.yml

# 3. 恢复数据库
docker-compose up -d db
docker-compose exec db psql -U directus directus < backup-db-YYYYMMDD.sql

# 4. 恢复 Directus 架构
docker-compose up -d directus
sudo docker compose exec directus npx directus schema apply --yes schemas/backup-before-migration-YYYYMMDD.yml

# 5. 启动旧服务
docker-compose up -d
```

## 📞 **迁移支持**

### **常见问题**

**1. SSL 证书申请失败**

- 检查域名 DNS 解析是否正确
- 确认防火墙端口 80、443 开放
- 等待 DNS 传播完成（可能需要几小时）

**2. 服务无法访问**

- 检查 JC21 代理配置是否正确
- 验证容器间网络连通性
- 查看容器日志排查问题

**3. 数据库迁移失败**

- 使用备份文件恢复数据
- 检查 Directus 版本兼容性
- 手动执行 SQL 迁移脚本

### **获取帮助**

1. 查看详细日志: `docker-compose logs service-name`
2. 参考故障排除: [DEPLOYMENT.md#故障排除](../DEPLOYMENT.md#故障排除)
3. 回滚到备份状态按上述回滚计划操作

---

**⚠️ 重要提醒**:

- 迁移过程中请保持数据备份
- 建议在维护窗口期间执行迁移
- 迁移完成后及时测试所有功能
- 保留旧备份至少 30 天以防需要回滚
