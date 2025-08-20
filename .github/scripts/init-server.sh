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

# 下载 docker-compose 文件
curl -o docker-compose.db.yml https://raw.githubusercontent.com/rayhu/avatar-mgmt/main/docker-compose.db.yml
curl -o docker-compose.ghcr.yml https://raw.githubusercontent.com/rayhu/avatar-mgmt/main/docker-compose.ghcr.yml
curl -o docker-compose.jc21.yml https://raw.githubusercontent.com/rayhu/avatar-mgmt/main/docker-compose.jc21.yml

# 下载部署脚本
curl -o deploy-ghcr-simple.sh https://raw.githubusercontent.com/rayhu/avatar-mgmt/main/.github/scripts/deploy-ghcr-simple.sh
chmod +x deploy-ghcr-simple.sh

echo "✅ 配置文件下载完成"

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
docker compose -f docker-compose.jc21.yml up -d

# 等待网络创建
echo "⏳ 等待网络创建..."
sleep 10

# 启动数据库和 Directus
echo "🗄️ 启动数据库和 Directus..."
docker compose -f docker-compose.db.yml up -d

echo "✅ 服务器初始化完成！"
echo ""
echo "下一步操作:"
echo "1. 编辑环境变量文件:"
echo "   - nano .env.stage.api"
echo "   - nano .env.stage.directus"
echo ""
echo "2. 测试服务状态:"
echo "   - docker compose -f docker-compose.jc21.yml ps"
echo "   - docker compose -f docker-compose.db.yml ps"
echo ""
echo "3. 部署应用:"
echo "   - ./deploy-ghcr-simple.sh"
echo ""
echo "服务地址:"
echo "  - JC21 Admin: http://localhost:81"
echo "  - Directus: http://localhost:8055"
echo ""
echo "注意: 请确保编辑环境变量文件中的密码和配置！"
