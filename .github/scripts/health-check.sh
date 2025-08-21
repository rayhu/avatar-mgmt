#!/bin/bash
# 通用健康检查脚本
set -e

echo "🔍 Starting health check..."

# 等待服务启动
echo "⏳ Waiting for services to start..."
sleep 10

# 检查 Docker 服务状态
echo "📊 Docker services status:"
sudo GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-rayhu/avatar-mgmt}" IMAGE_TAG="${IMAGE_TAG:-latest}" docker compose -f $DOCKER_COMPOSE_FILE ps

# 检查服务健康状态
echo "🏥 Checking service health..."

# 检查 API 服务
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API service is healthy"
else
    echo "❌ API service health check failed"
    exit 1
fi

echo "🎉 All services are healthy!"
