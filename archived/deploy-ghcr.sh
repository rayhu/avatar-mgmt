#!/bin/bash
# 从 GHCR 拉取预构建镜像的部署脚本
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

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN environment variable is required"
    exit 1
fi

if [ -z "$GITHUB_ACTOR" ]; then
    echo "❌ GITHUB_ACTOR environment variable is required"
    exit 1
fi

# 设置镜像标签，默认为 latest
IMAGE_TAG=${IMAGE_TAG:-latest}

echo "🚀 Starting GHCR-based deployment..."
echo "Target: $STAGING_HOST"
echo "Repository: $GITHUB_REPOSITORY"
echo "Branch: $GITHUB_REF_NAME"
echo "Commit: $GITHUB_SHA"
echo "Image Tag: $IMAGE_TAG"
echo "Deploy time: $(date)"

# 确保目录存在
sudo mkdir -p /opt/avatar-mgmt
sudo chown $USER:$USER /opt/avatar-mgmt
sudo chmod 755 /opt/avatar-mgmt
## 确保db_data目录权限正确
echo "🔧 确保db_data目录权限正确..."
sudo chown -R 999:999 /opt/deploy-avatar/db_data/
sudo chmod -R 700 /opt/deploy-avatar/db_data/

cd /opt/avatar-mgmt

# 检查并初始化 Git 仓库（如果需要配置文件）
if [ ! -d ".git" ]; then
    echo "📥 Git repository not found, cloning for config files..."
    ssh-keyscan -H github.com >> ~/.ssh/known_hosts
    git clone git@github.com:${GITHUB_REPOSITORY}.git .
    echo "✅ Repository cloned successfully"
else
    echo "📥 Git repository found, updating config files..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd || true
    echo "✅ Repository updated successfully"
fi

sudo chown -R $USER:$USER /opt/avatar-mgmt
## 确保db_data目录权限正确
echo "🔧 确保db_data目录权限正确..."
sudo chown -R 999:999 /opt/deploy-avatar/db_data/
sudo chmod -R 700 /opt/deploy-avatar/db_data/

# 检查配置文件
if [ ! -f ".env.api" ]; then
    echo "❌ Staging config file not found!"
    echo "Please create .env.api on the server"
    exit 1
fi

if [ ! -f ".env.directus" ]; then
    echo "❌ Staging config file not found!"
    echo "Please create .env.directus on the server"
    exit 1
fi

# 设置环境变量
echo "🔧 Setting environment variables..."
export GITHUB_REPOSITORY="$GITHUB_REPOSITORY"
export IMAGE_TAG="$IMAGE_TAG"

# 登录到 GHCR（如果需要）
echo "🔐 Logging into GHCR..."
echo "${GITHUB_TOKEN}" | docker login ghcr.io -u ${GITHUB_ACTOR} --password-stdin

# 拉取最新镜像
echo "📥 Pulling latest images from GHCR..."
docker pull "ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG"
docker pull "ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG"

# 停止并清理旧服务
echo "🧹 Cleaning up old services..."
sudo docker compose -f docker-compose.ghcr.yml down --volumes --remove-orphans

# 启动服务
echo "🚀 Starting services with GHCR images..."
sudo docker compose -f docker-compose.ghcr.yml up -d

echo "✅ GHCR-based deployment completed!"
echo "Images used:"
echo "  - API: ghcr.io/$GITHUB_REPOSITORY/api:$IMAGE_TAG"
echo "  - Frontend: ghcr.io/$GITHUB_REPOSITORY/frontend:$IMAGE_TAG"
