#!/bin/bash
# 分离式部署脚本 - 分别管理数据库和应用服务
set -e

# 检查必需的环境变量
if [ -z "$STAGING_HOST" ]; then
    echo "❌ STAGING_HOST environment variable is required"
    exit 1
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "❌ GITHUB_REPOSITORY environment variable is required"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN environment variable is required"
    exit 1
fi

if [ -z "$GITHUB_ACTOR" ]; then
    echo "❌ GITHUB_ACTOR environment variable is required"
    exit 1
fi

# 设置镜像标签，默认为 latest
IMAGE_TAG=${IMAGE_TAG:-latest}

echo "🚀 Starting split deployment..."
echo "Target: $STAGING_HOST"
echo "Repository: $GITHUB_REPOSITORY"
echo "Branch: $GITHUB_REF_NAME"
echo "Commit: $GITHUB_SHA"
echo "Image Tag: $IMAGE_TAG"
echo "Deploy time: $(date)"

# 确保目录存在
sudo mkdir -p /opt/deploy-avatar
sudo mkdir -p /opt/deploy-avatar/db_data
sudo mkdir -p /opt/deploy-avatar/directus/uploads
sudo mkdir -p /opt/deploy-avatar/directus/extensions
sudo mkdir -p /opt/deploy-avatar/directus/schemas

sudo chown -R $USER:$USER /opt/deploy-avatar

cd /opt/deploy-avatar

# 检查配置文件
if [ ! -f ".env.api" ]; then
    echo "❌ Staging config file not found!"
    echo "Please create .env.api on the server"
    exit 1
fi

if [ ! -f ".env.directus" ]; then
    echo "❌ Staging config file not found!"
    echo "Please create .env.directus on the server"
    exit 1
fi

# 设置环境变量
echo "🔧 Setting environment variables..."
export GITHUB_REPOSITORY="$GITHUB_REPOSITORY"
export IMAGE_TAG="$IMAGE_TAG"

# 登录到 GHCR（如果需要）
echo "🔐 Logging into GHCR..."
echo "$GITHUB_TOKEN" | sudo docker login ghcr.io -u $GITHUB_ACTOR --password-stdin

# 步骤1: 启动数据库和 Directus 服务
echo "🗄️  Starting database and Directus services..."
sudo docker compose -f docker-compose.db.yml up -d

# 等待数据库就绪
echo "⏳ Waiting for database to be ready..."
sleep 30

# 检查 Directus 服务状态
echo "🔍 Checking Directus service status..."
if curl -f http://localhost:8055/ > /dev/null 2>&1; then
    echo "✅ Directus service is ready"
else
    echo "⚠️  Directus service not ready yet, waiting..."
    sleep 30
fi

# 步骤2: 拉取应用镜像
echo "📥 Pulling application images from GHCR..."
docker pull "ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG"
docker pull "ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG"

# 步骤3: 启动应用服务
echo "🚀 Starting application services..."
sudo docker compose -f docker-compose.ghcr.yml up -d

echo "✅ Split deployment completed!"
echo ""
echo "Services status:"
echo "  - Database: docker compose -f docker-compose.db.yml ps"
echo "  - Application: docker compose -f docker-compose.ghcr.yml ps"
echo ""
echo "Images used:"
echo "  - API: ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG"
echo "  - Frontend: ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG"
echo ""
echo "Service URLs:"
echo "  - API: http://localhost:3000"
echo "  - Frontend: http://localhost:4173"
echo "  - Directus: http://localhost:8055"
echo ""
echo "Management commands:"
echo "  - Stop all: docker compose -f docker-compose.db.yml down && docker compose -f docker-compose.ghcr.yml down"
echo "  - Restart app only: docker compose -f docker-compose.ghcr.yml restart"
echo "  - Restart db only: docker compose -f docker-compose.db.yml restart"
