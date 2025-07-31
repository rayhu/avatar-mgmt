#!/bin/bash

# 数字人管理系统简化部署脚本 - 使用 Nginx Proxy Manager
# ======================================================

set -e

# 配置变量
DOMAIN="xiaoying.amis.hk"
PROJECT_DIR="$(pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查前置条件
check_prerequisites() {
    log_info "检查部署前置条件..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    # 检查域名解析
    log_info "检查域名解析..."
    if ! nslookup $DOMAIN &> /dev/null; then
        log_warning "无法解析域名 $DOMAIN，请确保 DNS 配置正确"
    fi
    
    log_success "前置条件检查完成"
}

# 创建必要目录
setup_directories() {
    log_info "创建必要目录..."
    
    mkdir -p data/mysql
    mkdir -p letsencrypt
    mkdir -p directus/uploads directus/extensions directus/schemas
    mkdir -p db_data
    
    log_success "目录创建完成"
}

# 构建和启动服务
deploy_services() {
    log_info "构建和启动服务..."
    
    # 停止现有服务
    docker compose -f docker-compose.prod-simple.yml down 2>/dev/null || true
    
    # 构建镜像
    log_info "构建 Docker 镜像..."
    docker compose -f docker-compose.prod-simple.yml build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker compose -f docker-compose.prod-simple.yml up -d
    
    log_success "服务启动完成"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    # 等待 Nginx Proxy Manager 启动
    log_info "等待 Nginx Proxy Manager 启动..."
    for i in {1..30}; do
        if curl -s http://localhost:81 >/dev/null 2>&1; then
            log_success "Nginx Proxy Manager 已启动"
            break
        fi
        sleep 2
    done
    
    # 等待其他服务启动
    sleep 10
    
    log_success "所有服务启动完成"
}

# 显示配置信息
show_config_info() {
    echo
    echo "=========================================="
    echo "🎉 部署完成！"
    echo "=========================================="
    echo
    echo "🌐 Nginx Proxy Manager 管理界面："
    echo "   URL: http://$(hostname -I | awk '{print $1}'):81"
    echo "   邮箱: admin@example.com"
    echo "   密码: changeme"
    echo
    echo "📋 配置步骤："
    echo "1. 访问管理界面并登录"
    echo "2. 修改默认密码"
    echo "3. 添加代理主机："
    echo "   - 域名: $DOMAIN"
    echo "   - 目标: http://api:3000 (API)"
    echo "   - 域名: $DOMAIN"
    echo "   - 目标: http://directus:8055 (Directus)"
    echo "4. 启用 SSL 证书（Let's Encrypt）"
    echo
    echo "🔧 服务信息："
    echo "   API 服务: http://api:3000"
    echo "   Directus: http://directus:8055"
    echo "   数据库: postgres:5432"
    echo
    echo "📊 管理命令："
    echo "   查看状态: docker compose -f docker-compose.prod-simple.yml ps"
    echo "   查看日志: docker compose -f docker-compose.prod-simple.yml logs -f"
    echo "   重启服务: docker compose -f docker-compose.prod-simple.yml restart"
    echo "   停止服务: docker compose -f docker-compose.prod-simple.yml down"
    echo
    echo "📚 文档："
    echo "   Nginx Proxy Manager: https://nginxproxymanager.com/"
    echo "   简化部署指南: DEPLOY-DAIDAI-SIMPLE.md"
    echo
    echo "=========================================="
}

# 主函数
main() {
    echo "🚀 开始简化部署数字人管理系统"
    echo "使用 Nginx Proxy Manager 进行反向代理"
    echo
    
    check_prerequisites
    setup_directories
    deploy_services
    wait_for_services
    show_config_info
}

# 执行主函数
main "$@" 
