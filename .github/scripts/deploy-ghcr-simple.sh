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

# 验证 docker-compose.ghcr.yml 文件中的镜像标签
echo "🔍 验证 docker-compose.ghcr.yml 中的镜像标签..."
if [ -f "docker-compose.ghcr.yml" ]; then
  echo "📋 当前 docker-compose.ghcr.yml 中的镜像引用:"
  grep "ghcr.io/$GITHUB_REPOSITORY" docker-compose.ghcr.yml || echo "⚠️  未找到镜像引用"
  
  # 检查是否包含正确的镜像标签（文件应该已经被工作流预处理过）
  if grep -q "ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG" docker-compose.ghcr.yml && \
     grep -q "ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG" docker-compose.ghcr.yml; then
    echo "✅ docker-compose.ghcr.yml 中的镜像标签与目标版本匹配"
  else
    echo "⚠️  docker-compose.ghcr.yml 中的镜像标签与目标版本不匹配"
    echo "🔧 正在更新 docker-compose.ghcr.yml 文件..."
    
    # 备份原文件
    cp docker-compose.ghcr.yml docker-compose.ghcr.yml.backup.$(date +%Y%m%d_%H%M%S)
    echo "📋 备份已创建"
    
    # 更新镜像标签（处理可能的变量占位符）
    sed -i "s|ghcr.io/$GITHUB_REPOSITORY/api:[^[:space:]]*|ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG|g" docker-compose.ghcr.yml
    sed -i "s|ghcr.io/$GITHUB_REPOSITORY/frontend:[^[:space:]]*|ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG|g" docker-compose.ghcr.yml
    
    echo "✅ 已更新 docker-compose.ghcr.yml 文件"
    echo "📋 更新后的镜像引用:"
    grep "ghcr.io/$GITHUB_REPOSITORY" docker-compose.ghcr.yml
  fi
else
  echo "❌ docker-compose.ghcr.yml 文件不存在"
  exit 1
fi

# 检查其他必要的 docker-compose 文件
echo "🔍 检查 docker-compose 文件完整性..."
REQUIRED_FILES=("docker-compose.ghcr.yml")

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ 必需文件不存在: $file"
    exit 1
  else
    echo "✅ 必需文件存在: $file"
  fi
done

# 检查配置文件
if [ ! -f ".env.api" ]; then
    echo "❌ 配置文件不存在: .env.api"
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
if ! sudo docker info | grep -q "Username"; then
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

# 验证实际运行的镜像是否与预期一致
echo "🔍 验证镜像版本一致性..."
API_ACTUAL=$(sudo docker inspect avatar-mgmt-app-api-1 --format='{{.Config.Image}}' 2>/dev/null || echo "not_found")
FRONTEND_ACTUAL=$(sudo docker inspect avatar-mgmt-app-frontend-1 --format='{{.Config.Image}}' 2>/dev/null || echo "not_found")

API_EXPECTED="ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG"
FRONTEND_EXPECTED="ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG"

echo "版本一致性检查:"
echo "  API:"
echo "    预期: $API_EXPECTED"
echo "    实际: $API_ACTUAL"
if [ "$API_ACTUAL" = "$API_EXPECTED" ]; then
  echo "    ✅ 版本匹配"
else
  echo "    ❌ 版本不匹配"
fi

echo "  Frontend:"
echo "    预期: $FRONTEND_EXPECTED"
echo "    实际: $FRONTEND_ACTUAL"
if [ "$FRONTEND_ACTUAL" = "$FRONTEND_EXPECTED" ]; then
  echo "    ✅ 版本匹配"
else
  echo "    ❌ 版本不匹配"
fi

echo ""
echo "服务地址:"
echo "  - API: http://localhost:3000"
echo "  - Frontend: http://localhost:4173"
echo ""
echo "管理命令:"
echo "  - 查看应用状态: sudo docker compose -f docker-compose.ghcr.yml ps"
echo "  - 重启应用: sudo docker compose -f docker-compose.ghcr.yml restart"
echo "  - 查看日志: sudo docker compose -f docker-compose.ghcr.yml logs -f"
echo ""
echo "📋 部署摘要:"
echo "  - 目标版本: $IMAGE_TAG"
echo "  - 部署时间: $(date)"
echo "  - 部署状态: 完成"
echo "  - 版本一致性: $([ "$API_ACTUAL" = "$API_EXPECTED" ] && [ "$FRONTEND_ACTUAL" = "$FRONTEND_EXPECTED" ] && echo "✅ 一致" || echo "❌ 不一致")"
