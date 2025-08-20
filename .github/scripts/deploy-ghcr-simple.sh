#!/bin/bash
# 简化部署脚本 - 只更新预构建镜像，不需要源代码
set -e

# 配置
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-rayhu/avatar-mgmt}
IMAGE_TAG=${IMAGE_TAG:-latest}
DEPLOY_DIR="/opt/deploy-avatar"

echo "🚀 开始简化部署..."
echo "仓库: $GITHUB_REPOSITORY"
echo "镜像标签: $IMAGE_TAG"
echo "部署目录: $DEPLOY_DIR"
echo "时间: $(date)"

# 检查部署目录
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ 部署目录不存在: $DEPLOY_DIR"
    echo "请先运行初始化脚本创建必要的目录和配置文件"
    exit 1
fi

SOURCE_DIR="/opt/avatar-mgmt"

if cp "$SOURCE_DIR/.github/scripts/copy_files_to_deploy.sh" .; then
    echo "✅ copy_files_to_deploy脚本文件复制完成"
else
    echo "❌ copy_files_to_deploy脚本文件复制失败"
    exit 1
fi

cd "$DEPLOY_DIR"
chmod +x copy_files_to_deploy.sh

if ./copy_files_to_deploy.sh; then
    echo "✅ 配置文件复制完成"
else
    echo "❌ 配置文件复制失败"
    exit 1
fi

# 检查配置文件
if [ ! -f ".env.stage.api" ]; then
    echo "❌ 配置文件不存在: .env.stage.api"
    echo "请确保配置文件已放置在 $DEPLOY_DIR 目录中"
    exit 1
fi

if [ ! -f ".env.stage.directus" ]; then
    echo "❌ 配置文件不存在: .env.stage.directus"
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
sudo docker compose -f docker-compose.ghcr.yml down

# 启动应用服务
echo "🚀 启动应用服务..."
sudo docker compose -f docker-compose.ghcr.yml up -d

# 检查服务状态
echo "🔍 检查服务状态..."
sleep 10
sudo docker compose -f docker-compose.ghcr.yml ps

echo "✅ 部署完成！"
echo ""
echo "使用的镜像:"
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
