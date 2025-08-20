#!/bin/bash
# 部署到 staging 环境的脚本
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

echo "🚀 Starting Staging deployment..."
echo "Target: $STAGING_HOST"
echo "Repository: $GITHUB_REPOSITORY"
echo "Branch: $GITHUB_REF_NAME"
echo "Commit: $GITHUB_SHA"
echo "Deploy time: $(date)"

# Git 操作
echo "📥 Updating repository..."
git fetch origin
git reset --hard origin/main
git clean -fd frontend/ api-server/ scripts/ || true

# 安装前端依赖并构建
echo "🏗️ Building frontend..."
cd frontend

# 设置前端环境变量
echo "VITE_API_BASE_URL=https://api.$STAGING_HOST" > .env.production
echo "VITE_DIRECTUS_BASE_URL=https://directus.$STAGING_HOST" >> .env.production

yarn install --frozen-lockfile
yarn build --mode production
cd ..

# 安装后端依赖
echo "📦 Installing backend dependencies..."
cd api-server
yarn install --frozen-lockfile
cd ..

# 生成版本信息
echo "🏷️ Generating version information..."
chmod +x scripts/generate-version.sh
./scripts/generate-version.sh stage

# 部署服务 - 使用更干净的部署方式
echo "🐳 Starting Docker services..."
echo "🧹 Cleaning up old containers and images..."

# 停止并清理所有服务
sudo docker compose -f docker-compose.stage.yml down --volumes --remove-orphans

# 清理 Docker 系统（更彻底）
echo "🧹 Cleaning Docker system..."
sudo docker system prune -f

# 清理所有构建缓存（关键步骤）
echo "🧹 Cleaning all Docker build cache..."
sudo docker builder prune -a -f

# 重新构建镜像（不使用缓存）
echo "🔨 Building fresh Docker images..."
sudo docker compose -f docker-compose.stage.yml build --no-cache

# 启动服务
echo "🚀 Starting services with fresh images..."
sudo docker compose -f docker-compose.stage.yml up -d

echo "✅ Staging deployment completed!"
