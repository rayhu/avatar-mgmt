#!/bin/bash
# 服务器初始化脚本 - 一次性设置服务器环境
set -e

echo "🚀 开始服务器初始化，创建目录并且启动基础服务..."
echo "时间: $(date)"

# 创建部署目录
SOURCE_DIR="/opt/avatar-mgmt"

DEPLOY_DIR="/opt/deploy-avatar"
echo "📁 创建部署目录: $DEPLOY_DIR"

sudo mkdir -p "$DEPLOY_DIR"
sudo mkdir -p "$DEPLOY_DIR/db_data"
sudo mkdir -p "$DEPLOY_DIR/directus/uploads"
sudo mkdir -p "$DEPLOY_DIR/directus/extensions"
sudo mkdir -p "$DEPLOY_DIR/directus/schemas"

# 设置权限
sudo chown -R $USER:$USER "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

## 确保db_data目录权限正确
echo "🔧 确保db_data目录权限正确..."
sudo chown -R 999:999 $DEPLOY_DIR/db_data/
sudo chmod -R 700 $DEPLOY_DIR/db_data/

# 复制 docker-compose 文件并检查
echo "复制 docker-compose.db.yml..."
if cp "$SOURCE_DIR/docker-compose.db.yml" .; then
    echo "✅ docker-compose.db.yml 复制成功"
else
    echo "❌ docker-compose.db.yml 复制失败"
    exit 1
fi

echo "复制 docker-compose.jc21.yml..."
if cp "$SOURCE_DIR/docker-compose.jc21.yml" .; then
    echo "✅ docker-compose.jc21.yml 复制成功"
else
    echo "❌ docker-compose.jc21.yml 复制失败"
    exit 1
fi

# 启动 JC21 网络管理
echo "🌐 启动 JC21 网络管理..."
if sudo docker compose -f docker-compose.jc21.yml up -d; then
    echo "✅ JC21 网络管理启动成功"
else
    echo "❌ JC21 网络管理启动失败"
    echo "请检查 docker-compose.jc21.yml 文件内容"
    exit 1
fi

# 等待网络创建
echo "⏳ 等待网络创建..."
sleep 10

# 启动数据库和 Directus
echo "🗄️ 启动数据库和 Directus..."
if sudo docker compose -f docker-compose.db.yml up -d; then
    echo "✅ 数据库和 Directus 启动成功"
else
    echo "❌ 数据库和 Directus 启动失败"
    echo "请检查 docker-compose.db.yml 文件内容"
    exit 1
fi

echo "✅ 服务器初始化完成！"
echo ""
echo "下一步操作:"
echo "1. 设置三个Proxy Hosts:"
echo "   - api api.daidai.amis.hk"
echo "   - directus directus.daidai.amis.hk"
echo "   - frontend daidai.amis.hk"
echo ""
echo "2. 测试服务状态:"
echo "   - sudo docker compose -f docker-compose.jc21.yml ps"
echo "   - sudo docker compose -f docker-compose.db.yml ps"
echo ""
echo "3. 编辑环境变量文件:"
echo "   - source set_var.sh"
echo "   - nano .env.api"
echo "   - nano .env.directus"
echo "   - nano .env.frontend"
echo ""
echo "4. 部署应用:"
echo "   - ./deploy-ghcr-simple.sh"
echo ""
echo "服务地址:"
echo "  - JC21 Admin: http://localhost:81"
echo "  - Directus: http://localhost:8055"
echo ""
echo "注意: 请确保编辑环境变量文件中的密码和配置！"
