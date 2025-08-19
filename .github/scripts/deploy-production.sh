#!/bin/bash
# 部署到 production 环境的脚本
set -e

# 检查必需的环境变量
if [ -z "$PRODUCTION_HOST" ]; then
    echo "❌ PRODUCTION_HOST environment variable is required"
    exit 1
fi

if [ -z "$RELEASE_TAG" ]; then
    echo "❌ RELEASE_TAG environment variable is required"
    exit 1
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "❌ GITHUB_REPOSITORY environment variable is required"
    exit 1
fi

echo "🚀 Starting Production deployment..."
echo "Target: $PRODUCTION_HOST"
echo "Release: $RELEASE_TAG"
echo "Repository: $GITHUB_REPOSITORY"
echo "Commit: $GITHUB_SHA"
echo "Deploy time: $(date)"

# Git 操作
echo "📥 Updating repository..."
git fetch --all --tags
git checkout --force $RELEASE_TAG

# 安装前端依赖并构建
echo "🏗️ Building frontend..."
cd frontend

# 设置前端环境变量
echo "VITE_API_BASE_URL=https://api.$PRODUCTION_HOST" > .env.production
echo "VITE_DIRECTUS_BASE_URL=https://directus.$PRODUCTION_HOST" >> .env.production

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
./scripts/generate-version.sh prod

# 部署服务
echo "🐳 Starting production services..."
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate --remove-orphans

echo "✅ Production deployment completed!"
