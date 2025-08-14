#!/bin/bash
# scripts/generate-version.sh (简化版)

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔧 生成版本信息..."

# 获取 Git 信息
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
COMMIT_DATE=$(git log -1 --format=%cd --date=iso 2>/dev/null || echo "unknown")
# 获取当前时间
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# 只生成一个版本信息文件，放在后端
mkdir -p api-server/version

cat > api-server/version/version.json << EOF
{
  "frontend": {
    "version": "1.0.0",
    "commitHash": "$COMMIT_HASH",
    "buildTime": "$BUILD_TIME",
    "branch": "$BRANCH",
    "commitDate": "$COMMIT_DATE"
  },
  "backend": {
    "version": "1.0.0",
    "commitHash": "$COMMIT_HASH",
    "buildTime": "$BUILD_TIME",
    "branch": "$BRANCH",
    "commitDate": "$COMMIT_DATE"
  },
  "system": {
    "deployTime": "$BUILD_TIME",
    "environment": "production",
    "uptime": "0s",
    "lastCheck": "$BUILD_TIME"
  },
  "generatedAt": "$BUILD_TIME"
}
EOF

echo "✅ Version information generated: api-server/version/version.json"
echo "  - Commit: $COMMIT_HASH ($BRANCH)"
echo "  - Build time: $BUILD_TIME"
