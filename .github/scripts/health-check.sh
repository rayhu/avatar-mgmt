#!/bin/bash
# 通用健康检查脚本
set -e

echo "🔍 Starting health check..."

# 等待服务启动
echo "⏳ Waiting for services to start..."
sleep 30

# 检查 Docker 服务状态
echo "📊 Docker services status:"
sudo docker compose -f $DOCKER_COMPOSE_FILE ps

# 检查服务健康状态
echo "🏥 Checking service health..."

# 检查 API 服务
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API service is healthy"
else
    echo "❌ API service health check failed"
    exit 1
fi

# 检查 Directus 服务
if curl -f http://localhost:8055/ > /dev/null 2>&1; then
    echo "✅ Directus service is healthy"
else
    echo "❌ Directus service health check failed"
    exit 1
fi

# 检查数据库服务
if sudo docker compose -f $DOCKER_COMPOSE_FILE exec -T db pg_isready -U directus > /dev/null 2>&1; then
    echo "✅ Database service is healthy"
else
    echo "❌ Database service health check failed"
    exit 1
fi

echo "🎉 All services are healthy!"
