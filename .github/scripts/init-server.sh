#!/bin/bash
# 服务器初始化脚本 - 一次性设置服务器环境
set -e

echo "🚀 开始服务器初始化..."
echo "时间: $(date)"

# 创建部署目录
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

cd "$DEPLOY_DIR"

# 下载必要的配置文件
echo "📥 下载配置文件..."

# 下载 docker-compose 文件并检查
echo "下载 docker-compose.db.yml..."
if curl -f -o docker-compose.db.yml https://raw.githubusercontent.com/rayhu/avatar-mgmt/main/docker-compose.db.yml; then
    echo "✅ docker-compose.db.yml 下载成功"
else
    echo "❌ docker-compose.db.yml 下载失败"
    exit 1
fi

echo "下载 docker-compose.ghcr.yml..."
if curl -f -o docker-compose.ghcr.yml https://raw.githubusercontent.com/rayhu/avatar-mgmt/main/docker-compose.ghcr.yml; then
    echo "✅ docker-compose.ghcr.yml 下载成功"
else
    echo "❌ docker-compose.ghcr.yml 下载失败"
    exit 1
fi

echo "下载 docker-compose.jc21.yml..."
if curl -f -o docker-compose.jc21.yml https://raw.githubusercontent.com/rayhu/avatar-mgmt/main/docker-compose.jc21.yml; then
    echo "✅ docker-compose.jc21.yml 下载成功"
else
    echo "❌ docker-compose.jc21.yml 下载失败"
    exit 1
fi

# 下载部署脚本
echo "下载部署脚本..."
if curl -f -o deploy-ghcr-simple.sh https://raw.githubusercontent.com/rayhu/avatar-mgmt/main/.github/scripts/deploy-ghcr-simple.sh; then
    chmod +x deploy-ghcr-simple.sh
    echo "✅ 部署脚本下载成功"
else
    echo "❌ 部署脚本下载失败"
    exit 1
fi

echo "✅ 配置文件下载完成"

# 验证 YAML 文件格式
echo "🔍 验证 YAML 文件格式..."
if sudo docker compose -f docker-compose.db.yml config > /dev/null 2>&1; then
    echo "✅ docker-compose.db.yml 格式正确"
else
    echo "❌ docker-compose.db.yml 格式错误"
    exit 1
fi

if sudo docker compose -f docker-compose.ghcr.yml config > /dev/null 2>&1; then
    echo "✅ docker-compose.ghcr.yml 格式正确"
else
    echo "❌ docker-compose.ghcr.yml 格式错误"
    exit 1
fi

if sudo docker compose -f docker-compose.jc21.yml config > /dev/null 2>&1; then
    echo "✅ docker-compose.jc21.yml 格式正确"
else
    echo "❌ docker-compose.jc21.yml 格式错误"
    exit 1
fi

# 创建环境变量文件模板
echo "🔧 创建环境变量文件模板..."

cat > .env.stage.api.template << 'EOF'
# API 服务环境变量
NODE_ENV=production
PORT=3000
# 添加其他需要的环境变量
EOF

cat > .env.stage.directus.template << 'EOF'
# Directus 环境变量
DB_CLIENT=pg
DB_HOST=db
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=your_password_here
# 添加其他需要的环境变量
EOF

echo "✅ 环境变量文件模板创建完成"

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
echo "1. 编辑环境变量文件:"
echo "   - nano .env.stage.api"
echo "   - nano .env.stage.directus"
echo ""
echo "2. 测试服务状态:"
echo "   - sudo docker compose -f docker-compose.jc21.yml ps"
echo "   - sudo docker compose -f docker-compose.db.yml ps"
echo ""
echo "3. 部署应用:"
echo "   - ./deploy-ghcr-simple.sh"
echo ""
echo "服务地址:"
echo "  - JC21 Admin: http://localhost:81"
echo "  - Directus: http://localhost:8055"
echo ""
echo "注意: 请确保编辑环境变量文件中的密码和配置！"
