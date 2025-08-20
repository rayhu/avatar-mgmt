SOURCE_DIR="/opt/avatar-mgmt"

DEPLOY_DIR="/opt/deploy-avatar"

# 复制必要的配置文件
echo "📥 复制配置文件..."

# 复制部署脚本
echo "复制部署脚本..."
if cp "$SOURCE_DIR/.github/scripts/deploy-ghcr-simple.sh" .; then
    chmod +x deploy-ghcr-simple.sh
    echo "✅ 部署脚本复制成功"
else
    echo "❌ 部署脚本复制失败"
    exit 1
fi

echo "✅ 配置文件复制完成"

if cp "$SOURCE_DIR/docker-compose.ghcr.yml" .; then
    echo "✅ docker-compose.ghcr.yml 复制成功"
else
    echo "❌ docker-compose.ghcr.yml 复制失败"
    exit 1
fi

if sudo docker compose -f docker-compose.ghcr.yml config > /dev/null 2>&1; then
    echo "✅ docker-compose.ghcr.yml 格式正确"
else
    echo "❌ docker-compose.ghcr.yml 格式错误"
    exit 1
fi

# 复制环境变量文件模板
echo "🔧 复制环境变量文件模板..."

echo "复制 API 环境变量文件..."
if cp "$SOURCE_DIR/env.stage.api.example" .env.stage.api.example; then
    echo "✅ API 环境变量文件复制成功"
else
    echo "❌ API 环境变量文件复制失败"
    exit 1
fi

echo "复制 Directus 环境变量文件..."
if cp "$SOURCE_DIR/env.stage.directus.example" .env.stage.directus.example; then
    echo "✅ Directus 环境变量文件复制成功"
else
    echo "❌ Directus 环境变量文件复制失败"
    exit 1
fi

echo "复制 Frontend 环境变量文件..."
if cp "$SOURCE_DIR/env.stage.frontend.example" .env.stage.frontend.example; then
    echo "✅ Frontend 环境变量文件复制成功"
else
    echo "❌ Frontend 环境变量文件复制失败"
    exit 1
fi

echo "✅ 环境变量文件模板复制完成"

echo "复制healthcheck脚本..."
if cp "$SOURCE_DIR/.github/scripts/health-check.sh" .; then
    chmod +x health-check.sh
    echo "✅ health-check脚本复制成功"
else
    echo "❌ health-check脚本复制失败"
    exit 1
fi
