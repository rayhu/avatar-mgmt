#!/bin/bash
# 本地部署脚本 - 从 GHCR 拉取预构建镜像
set -e

# 配置
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-rayhu/avatar-mgmt}
IMAGE_TAG=${IMAGE_TAG:-latest}
COMPOSE_FILE="docker-compose.ghcr.yml"

echo "🚀 开始本地 GHCR 部署..."
echo "仓库: $GITHUB_REPOSITORY"
echo "镜像标签: $IMAGE_TAG"
echo "时间: $(date)"

# 检查环境变量
if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "❌ 请设置 GITHUB_REPOSITORY 环境变量"
    exit 1
fi

# 设置环境变量
export GITHUB_REPOSITORY
export IMAGE_TAG

# 检查 docker-compose 文件是否存在
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 找不到 $COMPOSE_FILE 文件"
    echo "请确保在项目根目录下运行此脚本"
    exit 1
fi

# 检查配置文件
if [ ! -f ".env.stage.api" ]; then
    echo "⚠️  警告: 找不到 .env.stage.api 文件"
    echo "请确保配置文件存在"
fi

if [ ! -f ".env.stage.directus" ]; then
    echo "⚠️  警告: 找不到 .env.stage.directus 文件"
    echo "请确保配置文件存在"
fi

# 登录 GHCR (如果需要)
echo "🔐 检查 GHCR 登录状态..."
if ! docker info | grep -q "Username"; then
    echo "⚠️  未登录 GHCR，尝试登录..."
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
    else
        echo "❌ 请设置 GITHUB_TOKEN 和 GITHUB_USERNAME 环境变量"
        echo "或者手动运行: docker login ghcr.io"
        exit 1
    fi
else
    echo "✅ 已登录 GHCR"
fi

# 拉取镜像
echo "📥 拉取镜像..."
docker compose -f $COMPOSE_FILE pull

# 停止旧服务
echo "🛑 停止旧服务..."
docker compose -f $COMPOSE_FILE down --remove-orphans

# 启动新服务
echo "🚀 启动新服务..."
docker compose -f $COMPOSE_FILE up -d

# 检查服务状态
echo "🔍 检查服务状态..."
sleep 5
docker compose -f $COMPOSE_FILE ps

echo "✅ 本地部署完成！"
echo "使用的镜像:"
echo "  - API: ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG"
echo "  - Frontend: ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG"
echo ""
echo "服务地址:"
echo "  - API: http://localhost:3000"
echo "  - Frontend: http://localhost:4173"
echo "  - Directus: http://localhost:8055"
echo ""
echo "查看日志: docker compose -f $COMPOSE_FILE logs -f"
echo "停止服务: docker compose -f $COMPOSE_FILE down"
