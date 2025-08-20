#!/bin/bash
set -e

echo " 生成前端配置文件..."

# 设置默认值
API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:3000}
DIRECTUS_BASE_URL=${VITE_DIRECTUS_BASE_URL:-http://localhost:8055}
APP_ENV=${VITE_APP_ENV:-staging}
APP_TITLE=${VITE_APP_TITLE:-Avatar Management System}
APP_DESCRIPTION=${VITE_APP_DESCRIPTION:-Avatar Management and Animation System}
FEATURE_ANIMATION=${VITE_FEATURE_ANIMATION:-true}
FEATURE_UPLOAD=${VITE_FEATURE_UPLOAD:-true}
FEATURE_SHARING=${VITE_FEATURE_SHARING:-true}
DEBUG=${VITE_DEBUG:-false}

echo "🔧 Configuring frontend with:"
echo "  - API Base URL: $API_BASE_URL"
echo "  - Directus Base URL: $DIRECTUS_BASE_URL"
echo "  - App Environment: $APP_ENV"

# 创建运行时配置文件
cat > /usr/share/nginx/html/config.js << EOF
window.APP_CONFIG = {
  API_BASE_URL: '$API_BASE_URL',
  DIRECTUS_BASE_URL: '$DIRECTUS_BASE_URL',
  APP_ENV: '$APP_ENV',
  APP_TITLE: '$APP_TITLE',
  APP_DESCRIPTION: '$APP_DESCRIPTION',
  FEATURE_ANIMATION: $FEATURE_ANIMATION,
  FEATURE_UPLOAD: $FEATURE_UPLOAD,
  FEATURE_SHARING: $FEATURE_SHARING,
  DEBUG: $DEBUG,
  BUILD_TIME: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'
};
EOF

echo "✅ Configuration file created"

# 启动 nginx
echo "🌐 Starting nginx..."
exec "$@"
