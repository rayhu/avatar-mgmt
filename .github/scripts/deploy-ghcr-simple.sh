#!/bin/bash
# 简化部署脚本 - 只更新预构建镜像，不需要源代码
set -e

# 配置
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-rayhu/avatar-mgmt}
IMAGE_TAG=${IMAGE_TAG:-latest}
DEPLOY_DIR="/opt/deploy-avatar"
GITHUB_USERNAME=${GITHUB_ACTOR:-rayhu}

echo "🚀 开始简化部署..."
echo "仓库: $GITHUB_REPOSITORY"
echo "镜像标签: $IMAGE_TAG"
echo "部署目录: $DEPLOY_DIR"
echo "时间: $(date)"
echo ""
echo "🔧 环境变量配置:"
echo "  - GITHUB_REPOSITORY: $GITHUB_REPOSITORY"
echo "  - IMAGE_TAG: $IMAGE_TAG"
echo "  - GITHUB_TOKEN: ${GITHUB_TOKEN:+已设置}"
echo "  - GITHUB_USERNAME: ${GITHUB_USERNAME:-未设置}"
echo "  - GITHUB_ACTOR: ${GITHUB_ACTOR:-未设置}"
echo "  - GITHUB_REF_NAME: ${GITHUB_REF_NAME:-未设置}"
echo "  - GITHUB_SHA: ${GITHUB_SHA:-未设置}"
echo "  - STAGING_HOST: ${STAGING_HOST:-未设置}"
echo "  - DEPLOY_DIR: $DEPLOY_DIR"
echo ""


# 检查配置文件
if [ ! -f ".env.api" ]; then
    echo "❌ 配置文件不存在: .env.api"
    echo "请确保配置文件已放置在 $DEPLOY_DIR 目录中"
    exit 1
fi

if [ ! -f ".env.directus" ]; then
    echo "❌ 配置文件不存在: .env.directus"
    echo "请确保配置文件已放置在 $DEPLOY_DIR 目录中"
    exit 1
fi

if [ ! -f ".env.frontend" ]; then
    echo "❌ 配置文件不存在: .env.frontend"
    echo "请确保配置文件已放置在 $DEPLOY_DIR 目录中"
    exit 1
fi

# 设置环境变量
export GITHUB_REPOSITORY
export IMAGE_TAG

# 登录 GHCR (如果需要)
echo "🔐 检查 GHCR 登录状态..."
if ! docker info | grep -q "Username"; then
    echo "⚠️  未登录 GHCR，尝试登录..."
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN" | sudo docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
    else
        echo "❌ 请设置 GITHUB_TOKEN 和 GITHUB_USERNAME 环境变量"
        echo "或者手动运行: docker login ghcr.io"
        exit 1
    fi
else
    echo "✅ 已登录 GHCR"
fi

# 拉取新镜像
echo "📥 拉取新镜像..."
sudo docker pull "ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG"
sudo docker pull "ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG"

# 停止应用服务
echo "🛑 停止应用服务..."
sudo GITHUB_REPOSITORY="$GITHUB_REPOSITORY" IMAGE_TAG="$IMAGE_TAG" docker compose -f docker-compose.ghcr.yml down

# 清理旧容器和镜像缓存（如果有）
echo "🧹 清理旧容器..."
sudo docker container prune -f

# 启动应用服务
echo "🚀 启动应用服务..."
echo "使用环境变量:"
echo "  - GITHUB_REPOSITORY=$GITHUB_REPOSITORY"
echo "  - IMAGE_TAG=$IMAGE_TAG"
sudo GITHUB_REPOSITORY="$GITHUB_REPOSITORY" IMAGE_TAG="$IMAGE_TAG" docker compose -f docker-compose.ghcr.yml up -d --force-recreate

# 检查服务状态
echo "🔍 检查服务状态..."
sleep 10
sudo GITHUB_REPOSITORY="$GITHUB_REPOSITORY" IMAGE_TAG="$IMAGE_TAG" docker compose -f docker-compose.ghcr.yml ps

echo "✅ 部署完成！"
echo ""
echo "📸 验证当前运行的镜像:"
sudo docker inspect avatar-mgmt-app-api-1 --format='{{.Config.Image}}' 2>/dev/null || echo "API容器未找到"
sudo docker inspect avatar-mgmt-app-frontend-1 --format='{{.Config.Image}}' 2>/dev/null || echo "Frontend容器未找到"
echo ""
echo "预期的镜像:"
echo "  - API: ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG"
echo "  - Frontend: ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG"
echo ""
echo "服务地址:"
echo "  - API: http://localhost:3000"
echo "  - Frontend: http://localhost:4173"
echo "  - Directus: http://localhost:8055"
echo ""
echo "管理命令:"
echo "  - 查看应用状态: sudo docker compose -f docker-compose.ghcr.yml ps"
echo "  - 查看数据库状态: sudo docker compose -f docker-compose.db.yml ps"
echo "  - 重启应用: sudo docker compose -f docker-compose.ghcr.yml restart"
echo "  - 查看日志: sudo docker compose -f docker-compose.ghcr.yml logs -f"
