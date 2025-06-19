#!/bin/bash

# 本地测试脚本 - 在笔记本电脑上测试 Nginx Proxy Manager
# ======================================================

set -e

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

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    local ports=("80" "443" "81" "3000" "8055")
    local conflicts=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            conflicts+=("$port")
        fi
    done
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        log_warning "以下端口已被占用："
        for port in "${conflicts[@]}"; do
            echo "  - 端口 $port"
        done
        echo
        log_warning "建议停止占用这些端口的服务，或者修改 docker-compose.local-test.yml 中的端口映射"
        echo
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "所有端口都可用"
    fi
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

# 检查环境文件
check_env_file() {
    log_info "检查环境配置文件..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_warning "未找到 .env 文件，从 .env.example 复制..."
            cp .env.example .env
            log_success "已创建 .env 文件，请根据需要编辑配置"
        else
            log_error "未找到 .env 或 .env.example 文件"
            exit 1
        fi
    else
        log_success "找到 .env 文件"
    fi
}

# 构建和启动服务
deploy_services() {
    log_info "构建和启动服务..."
    
    # 停止现有服务
    docker compose -f docker-compose.local-test.yml down 2>/dev/null || true
    
    # 构建镜像
    log_info "构建 Docker 镜像..."
    docker compose -f docker-compose.local-test.yml build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker compose -f docker-compose.local-test.yml up -d
    
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
        if [ $i -eq 30 ]; then
            log_error "Nginx Proxy Manager 启动超时"
            exit 1
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
    echo "🎉 本地测试环境部署完成！"
    echo "=========================================="
    echo
    echo "🌐 Nginx Proxy Manager 管理界面："
    echo "   URL: http://localhost:81"
    echo "   邮箱: admin@example.com"
    echo "   密码: changeme"
    echo
    echo "📋 本地测试配置步骤："
    echo "1. 访问管理界面并登录"
    echo "2. 修改默认密码"
    echo "3. 添加代理主机（本地测试）："
    echo "   - 域名: localhost"
    echo "   - 目标: http://api:3000 (API)"
    echo "   - 域名: localhost"
    echo "   - 路径: /admin"
    echo "   - 目标: http://directus:8055 (Directus)"
    echo
    echo "⚠️  重要提醒："
    echo "   - 本地测试时不要申请 SSL 证书"
    echo "   - 使用 localhost 而不是真实域名"
    echo "   - 这是测试环境，不要用于生产"
    echo
    echo "🔧 服务信息："
    echo "   API 服务: http://localhost (通过代理)"
    echo "   Directus: http://localhost/admin (通过代理)"
    echo "   直接访问 Directus: http://localhost:8055"
    echo "   数据库: postgres:5432"
    echo
    echo "📊 管理命令："
    echo "   查看状态: docker compose -f docker-compose.local-test.yml ps"
    echo "   查看日志: docker compose -f docker-compose.local-test.yml logs -f"
    echo "   重启服务: docker compose -f docker-compose.local-test.yml restart"
    echo "   停止服务: docker compose -f docker-compose.local-test.yml down"
    echo
    echo "🧹 清理命令："
    echo "   完全清理: docker compose -f docker-compose.local-test.yml down -v"
    echo "   删除数据: rm -rf data db_data directus/uploads"
    echo
    echo "=========================================="
}

# 主函数
main() {
    echo "🖥️  开始本地测试 Nginx Proxy Manager"
    echo "适用于笔记本电脑环境"
    echo
    
    check_ports
    check_env_file
    setup_directories
    deploy_services
    wait_for_services
    show_config_info
}

# 执行主函数
main "$@" 
