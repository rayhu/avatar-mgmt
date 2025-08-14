#!/bin/bash

# 版本管理脚本
# 用法: ./scripts/deploy/version.sh [generate|clean|deploy]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq 未安装，将使用基本JSON输出"
    fi
    
    log_success "依赖检查完成"
}

# 生成版本信息
generate_version() {
    log_info "生成版本信息..."
    
    # 获取 Git 信息
    GIT_COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    GIT_COMMIT_DATE=$(git log -1 --format="%cd" --date=iso 2>/dev/null || echo "unknown")
    GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
    
    # 获取当前时间
    BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    DEPLOY_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # 生成版本号 (基于日期和commit hash)
    VERSION=$(date +"%Y.%m.%d")-${GIT_COMMIT_HASH}
    
    # 如果有Git标签，使用标签作为版本号
    if [ "$GIT_TAG" != "none" ]; then
        VERSION="$GIT_TAG"
    fi
    
    # 前端版本信息
    FRONTEND_VERSION_INFO=$(cat <<EOF
{
  "version": "${VERSION}",
  "commitHash": "${GIT_COMMIT_HASH}",
  "buildTime": "${BUILD_TIME}",
  "branch": "${GIT_BRANCH}",
  "commitDate": "${GIT_COMMIT_DATE}",
  "gitTag": "${GIT_TAG}"
}
EOF
)

    # 后端版本信息
    BACKEND_VERSION_INFO=$(cat <<EOF
{
  "version": "${VERSION}",
  "commitHash": "${GIT_COMMIT_HASH}",
  "buildTime": "${BUILD_TIME}",
  "branch": "${GIT_BRANCH}",
  "commitDate": "${GIT_COMMIT_DATE}",
  "gitTag": "${GIT_TAG}"
}
EOF
)

    # 系统版本信息
    SYSTEM_VERSION_INFO=$(cat <<EOF
{
  "deployTime": "${DEPLOY_TIME}",
  "environment": "${NODE_ENV:-development}",
  "uptime": "0s",
  "deploymentId": "${DEPLOYMENT_ID:-$(date +%s)}"
}
EOF
)

    # 创建版本信息目录
    mkdir -p frontend/public/version
    mkdir -p api-server/version
    
    # 写入前端版本信息
    echo "$FRONTEND_VERSION_INFO" > frontend/public/version/frontend.json
    echo "$BACKEND_VERSION_INFO" > frontend/public/version/backend.json
    echo "$SYSTEM_VERSION_INFO" > frontend/public/version/system.json
    
    # 写入后端版本信息
    echo "$FRONTEND_VERSION_INFO" > api-server/version/frontend.json
    echo "$BACKEND_VERSION_INFO" > api-server/version/backend.json
    echo "$SYSTEM_VERSION_INFO" > api-server/version/system.json
    
    # 生成完整的版本信息
    FULL_VERSION_INFO=$(cat <<EOF
{
  "frontend": $FRONTEND_VERSION_INFO,
  "backend": $BACKEND_VERSION_INFO,
  "system": $SYSTEM_VERSION_INFO,
  "generatedAt": "${BUILD_TIME}",
  "deploymentInfo": {
    "deploymentId": "${DEPLOYMENT_ID:-$(date +%s)}",
    "deploymentTime": "${DEPLOY_TIME}",
    "deploymentUser": "${USER:-unknown}",
    "deploymentHost": "${HOSTNAME:-unknown}"
  }
}
EOF
)

    echo "$FULL_VERSION_INFO" > version.json
    echo "$FULL_VERSION_INFO" > frontend/public/version/full.json
    echo "$FULL_VERSION_INFO" > api-server/version/full.json
    
    log_success "版本信息生成完成"
    log_info "版本号: ${VERSION}"
    log_info "Commit Hash: ${GIT_COMMIT_HASH}"
    log_info "分支: ${GIT_BRANCH}"
    
    # 显示版本信息预览
    if command -v jq &> /dev/null; then
        echo ""
        log_info "版本信息预览:"
        echo "$FULL_VERSION_INFO" | jq '.'
    else
        echo ""
        log_info "版本信息预览:"
        echo "$FULL_VERSION_INFO"
    fi
}

# 清理版本信息
clean_version() {
    log_info "清理版本信息..."
    
    rm -rf frontend/public/version
    rm -rf api-server/version
    rm -f version.json
    
    log_success "版本信息清理完成"
}

# 部署版本信息
deploy_version() {
    log_info "部署版本信息..."
    
    # 生成版本信息
    generate_version
    
    # 复制到部署目录
    if [ -d "dist" ]; then
        cp -r frontend/public/version dist/version
        log_success "版本信息已复制到 dist/version/"
    fi
    
    if [ -d "build" ]; then
        cp -r api-server/version build/version
        log_success "版本信息已复制到 build/version/"
    fi
    
    log_success "版本信息部署完成"
}

# 显示帮助信息
show_help() {
    echo "版本管理脚本"
    echo ""
    echo "用法: $0 [COMMAND]"
    echo ""
    echo "命令:"
    echo "  generate    生成版本信息"
    echo "  clean       清理版本信息"
    echo "  deploy      部署版本信息"
    echo "  help        显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  NODE_ENV         环境标识 (development/staging/production)"
    echo "  DEPLOYMENT_ID    部署ID (可选)"
    echo ""
    echo "示例:"
    echo "  $0 generate"
    echo "  $0 deploy"
    echo "  NODE_ENV=production $0 deploy"
}

# 主函数
main() {
    local command=${1:-help}
    
    case $command in
        generate)
            check_dependencies
            generate_version
            ;;
        clean)
            clean_version
            ;;
        deploy)
            check_dependencies
            deploy_version
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
