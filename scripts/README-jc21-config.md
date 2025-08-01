# jc21 Nginx Proxy Manager 自动化配置脚本

这个目录包含了用于自动化配置 jc21 Nginx Proxy Manager 的脚本工具。

## 📁 文件说明

| 文件 | 语言 | 说明 |
|------|------|------|
| `configure-jc21-proxy.js` | Node.js | 功能完整的 JavaScript 配置脚本 |
| `configure-jc21-proxy.sh` | Shell | 轻量级的 Shell 配置脚本 |
| `configure-jc21-proxy.py` | Python | 功能完整的 Python 配置脚本 |
| `jc21-proxy-config.json` | JSON | 配置文件示例 |
| `README-jc21-config.md` | Markdown | 本文档 |

## 🚀 快速开始

### 前置条件

1. **确保 jc21 服务已启动**
   ```bash
   docker compose -f docker-compose.prod-simple.yml up -d
   ```

2. **等待服务初始化完成**
   ```bash
   # 检查服务状态
   docker compose -f docker-compose.prod-simple.yml ps
   
   # 查看日志
   docker compose -f docker-compose.prod-simple.yml logs nginx-proxy-manager
   ```

3. **安装必要的依赖**

   **Node.js 版本:**
   ```bash
   npm install sqlite3
   ```

   **Python 版本:**
   ```bash
   # Python 3 自带 sqlite3 模块，无需额外安装
   ```

   **Shell 版本:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install sqlite3
   
   # CentOS/RHEL
   sudo yum install sqlite
   
   # macOS
   brew install sqlite3
   ```

### 基本使用

#### 1. 查看当前配置
```bash
# Node.js 版本
node scripts/configure-jc21-proxy.js --list

# Python 版本
python3 scripts/configure-jc21-proxy.py --list

# Shell 版本
chmod +x scripts/configure-jc21-proxy.sh
./scripts/configure-jc21-proxy.sh --list
```

#### 2. 创建默认配置
```bash
# Node.js 版本
node scripts/configure-jc21-proxy.js --create

# Python 版本
python3 scripts/configure-jc21-proxy.py --create

# Shell 版本
./scripts/configure-jc21-proxy.sh --create
```

#### 3. 创建本地测试配置
```bash
# Node.js 版本
node scripts/configure-jc21-proxy.js --create-local

# Python 版本
python3 scripts/configure-jc21-proxy.py --create-local

# Shell 版本
./scripts/configure-jc21-proxy.sh --create-local
```

## 📋 详细用法

### Node.js 脚本

```bash
# 显示帮助
node scripts/configure-jc21-proxy.js --help

# 查看当前配置
node scripts/configure-jc21-proxy.js --list

# 创建默认配置
node scripts/configure-jc21-proxy.js --create

# 删除指定代理主机
node scripts/configure-jc21-proxy.js --delete 1

# 从配置文件创建
node scripts/configure-jc21-proxy.js --config-file scripts/jc21-proxy-config.json
```

### Python 脚本

```bash
# 显示帮助
python3 scripts/configure-jc21-proxy.py --help

# 查看当前配置
python3 scripts/configure-jc21-proxy.py --list

# 创建默认配置
python3 scripts/configure-jc21-proxy.py --create

# 创建本地测试配置
python3 scripts/configure-jc21-proxy.py --create-local

# 更新代理主机配置
python3 scripts/configure-jc21-proxy.py --update 1 api.example.com api 3000

# 配置 SSL
python3 scripts/configure-jc21-proxy.py --ssl 1 true

# 备份数据库
python3 scripts/configure-jc21-proxy.py --backup ./backup.sqlite

# 从配置文件创建
python3 scripts/configure-jc21-proxy.py --config-file scripts/jc21-proxy-config.json
```

### Shell 脚本

```bash
# 显示帮助
./scripts/configure-jc21-proxy.sh --help

# 查看当前配置
./scripts/configure-jc21-proxy.sh --list

# 创建默认配置
./scripts/configure-jc21-proxy.sh --create

# 创建本地测试配置
./scripts/configure-jc21-proxy.sh --create-local

# 删除指定代理主机
./scripts/configure-jc21-proxy.sh --delete 1

# 更新代理主机配置
./scripts/configure-jc21-proxy.sh --update 1 api.example.com api 3000 http 1 1 1

# 配置 SSL
./scripts/configure-jc21-proxy.sh --ssl 1 1 1 1 1

# 备份数据库
./scripts/configure-jc21-proxy.sh --backup

# 恢复数据库
./scripts/configure-jc21-proxy.sh --restore ./jc21/data/database-backup-20250101-120000.sqlite
```

## ⚙️ 配置选项

### 环境变量

可以通过环境变量自定义配置：

```bash
# 设置域名
export DOMAIN="your-domain.com"
export API_DOMAIN="api.your-domain.com"
export ADMIN_DOMAIN="admin.your-domain.com"

# 设置数据库路径
export DB_PATH="./jc21/data/database.sqlite"

# 运行脚本
./scripts/configure-jc21-proxy.sh --create
```

### 配置文件

使用 JSON 配置文件进行批量配置：

```bash
# 创建自定义配置文件
cp scripts/jc21-proxy-config.json my-config.json

# 编辑配置文件
vim my-config.json

# 使用配置文件
python3 scripts/configure-jc21-proxy.py --config-file my-config.json
```

## 🔧 配置示例

### 生产环境配置

```json
{
  "name": "API 服务",
  "domain_names": "api.daidai.amis.hk",
  "forward_host": "api",
  "forward_port": 3000,
  "forward_scheme": "http",
  "ssl_forced": true,
  "websockets_support": true,
  "block_exploits": true,
  "advanced_config": "# API 服务自定义配置\nclient_max_body_size 10M;\nproxy_read_timeout 300s;"
}
```

### 本地测试配置

```json
{
  "name": "API 服务 (本地测试)",
  "domain_names": "localhost",
  "forward_host": "api",
  "forward_port": 3000,
  "forward_scheme": "http",
  "ssl_forced": false,
  "websockets_support": true,
  "block_exploits": true
}
```

### 路径代理配置

```json
{
  "name": "API 服务 (路径代理)",
  "domain_names": "daidai.amis.hk",
  "forward_host": "api",
  "forward_port": 3000,
  "forward_scheme": "http",
  "ssl_forced": true,
  "websockets_support": true,
  "block_exploits": true,
  "locations": [
    {
      "path": "/api",
      "forward_host": "api",
      "forward_port": 3000,
      "forward_scheme": "http"
    }
  ]
}
```

## 🔍 故障排除

### 常见问题

#### 1. 数据库连接失败

**症状**: `数据库连接失败` 或 `数据库文件不存在`

**解决方案**:
```bash
# 检查 jc21 服务状态
docker compose -f docker-compose.prod-simple.yml ps

# 检查数据库文件
ls -la ./jc21/data/database.sqlite

# 重启 jc21 服务
docker compose -f docker-compose.prod-simple.yml restart nginx-proxy-manager
```

#### 2. 权限问题

**症状**: `Permission denied`

**解决方案**:
```bash
# 给脚本执行权限
chmod +x scripts/configure-jc21-proxy.sh

# 检查文件权限
ls -la scripts/

# 使用 sudo (如果需要)
sudo ./scripts/configure-jc21-proxy.sh --list
```

#### 3. SQLite3 未安装

**症状**: `sqlite3: command not found`

**解决方案**:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install sqlite3

# CentOS/RHEL
sudo yum install sqlite

# macOS
brew install sqlite3
```

#### 4. Node.js 依赖问题

**症状**: `Cannot find module 'sqlite3'`

**解决方案**:
```bash
# 安装依赖
npm install sqlite3

# 或者全局安装
npm install -g sqlite3
```

### 调试模式

启用调试模式查看详细信息：

```bash
# Node.js 版本
DEBUG=* node scripts/configure-jc21-proxy.js --list

# Python 版本
python3 -v scripts/configure-jc21-proxy.py --list

# Shell 版本
bash -x scripts/configure-jc21-proxy.sh --list
```

## 🔄 备份和恢复

### 自动备份

脚本会在修改配置前自动备份数据库：

```bash
# 备份文件位置
./jc21/data/database-backup-YYYYMMDD-HHMMSS.sqlite
```

### 手动备份

```bash
# 备份数据库
./scripts/configure-jc21-proxy.sh --backup

# 恢复数据库
./scripts/configure-jc21-proxy.sh --restore ./jc21/data/database-backup-20250101-120000.sqlite
```

### 备份策略

建议定期备份数据库：

```bash
# 创建备份脚本
cat > backup-jc21.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./jc21/backups"
mkdir -p $BACKUP_DIR
cp ./jc21/data/database.sqlite $BACKUP_DIR/database-$DATE.sqlite
echo "备份完成: $BACKUP_DIR/database-$DATE.sqlite"
EOF

chmod +x backup-jc21.sh

# 添加到 crontab (每天凌晨 2 点备份)
echo "0 2 * * * /path/to/your/project/backup-jc21.sh" | crontab -
```

## 📊 监控和维护

### 检查配置状态

```bash
# 定期检查配置
./scripts/configure-jc21-proxy.sh --list

# 检查服务状态
docker compose -f docker-compose.prod-simple.yml ps

# 查看日志
docker compose -f docker-compose.prod-simple.yml logs nginx-proxy-manager
```

### 清理旧配置

```bash
# 删除不需要的代理主机
./scripts/configure-jc21-proxy.sh --delete 1

# 清理备份文件 (保留最近 7 天)
find ./jc21/data -name "database-backup-*.sqlite" -mtime +7 -delete
```

## 🎯 最佳实践

### 1. 配置管理

- 使用版本控制管理配置文件
- 为不同环境创建不同的配置文件
- 定期备份和测试配置

### 2. 安全考虑

- 定期更新 jc21 镜像
- 启用 SSL 强制重定向
- 配置适当的访问控制

### 3. 性能优化

- 启用 HTTP/2 支持
- 配置适当的超时时间
- 启用 WebSocket 支持 (如需要)

### 4. 监控和日志

- 定期检查服务状态
- 监控 SSL 证书有效期
- 记录配置变更日志

## 📚 相关资源

- [jc21/nginx-proxy-manager 官方文档](https://nginxproxymanager.com/)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [Docker Compose 文档](https://docs.docker.com/compose/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这些脚本！

## 📄 许可证

本项目采用 Apache License 2.0 许可证。 
