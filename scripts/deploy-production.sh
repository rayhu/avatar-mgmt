#!/bin/bash

# 生产环境部署脚本
# 完整的 JC21 + 应用部署
# ======================================

set -e

# 配置变量
COMPOSE_FILE="docker-compose.prod-simple.yml"
DOMAIN="${DOMAIN:-daidai.amis.hk}"
LOCAL_DOMAIN="${LOCAL_DOMAIN:-localhost}"
DB_PATH="./jc21/data/database.sqlite"

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

# 显示帮助信息
show_help() {
    echo "
生产环境部署脚本

用法:
  $0 [选项]

选项:
  --deploy, -d             完整部署生产环境
  --deploy-local, -dl      部署本地测试环境
  --clean, -c              清理所有容器和数据
  --status, -s             查看服务状态
  --logs, -l               查看服务日志
  --configure, -cf         仅配置 JC21 代理
  --help, -h               显示帮助信息

环境变量:
  DOMAIN          生产环境域名 (默认: daidai.amis.hk)
  LOCAL_DOMAIN    本地测试域名 (默认: localhost)

示例:
  $0 --deploy
  $0 --deploy-local
  $0 --clean
  DOMAIN=example.com $0 --deploy
"
}

# 检查 Docker 环境
check_docker() {
    log_info "检查 Docker 环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker 未运行，请启动 Docker"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "Docker 环境检查通过"
}

# 检查必要文件
check_files() {
    log_info "检查必要文件..."
    
    local required_files=(
        "$COMPOSE_FILE"
        ".env.prod"
        "scripts/configure-jc21-path-based-fixed.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "必要文件不存在: $file"
            exit 1
        fi
    done
    
    log_success "文件检查通过"
}

# 清理环境
clean_environment() {
    log_info "清理 Docker 环境..."
    
    # 停止所有服务
    docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    
    # 清理 Docker 系统
    docker system prune -f
    
    # 清理数据目录
    if [ -d "./jc21/data" ]; then
        log_warning "清理 JC21 数据目录..."
        rm -rf ./jc21/data/*
    fi
    
    if [ -d "./db_data" ]; then
        log_warning "清理数据库数据目录..."
        rm -rf ./db_data/*
    fi
    
    log_success "环境清理完成"
}

# 启动所有服务
start_services() {
    log_info "启动所有服务..."
    
    # 启动基础服务
    docker compose -f "$COMPOSE_FILE" up -d db nginx-proxy-manager-db
    
    # 等待数据库启动
    log_info "等待数据库启动..."
    sleep 30
    
    # 启动其他服务
    docker compose -f "$COMPOSE_FILE" up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 60
    
    log_success "服务启动完成"
}

# 检查服务健康状态
check_services() {
    log_info "检查服务健康状态..."
    
    local services=("db" "nginx-proxy-manager" "nginx-proxy-manager-db" "directus" "api" "frontend")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local status=$(docker compose -f "$COMPOSE_FILE" ps "$service" --format "table {{.Status}}" | tail -n +2)
        if [[ "$status" == *"Up"* ]]; then
            log_success "$service: 运行中"
        else
            log_warning "$service: $status"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_success "所有服务运行正常"
    else
        log_warning "部分服务可能有问题，请检查日志"
    fi
}

# 配置 JC21 代理
configure_proxy() {
    local domain="$1"
    local is_local="${2:-false}"
    
    log_info "配置 JC21 代理..."
    
    # 等待 JC21 服务完全启动
    log_info "等待 JC21 服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:81 >/dev/null 2>&1; then
            log_success "JC21 服务已启动"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "JC21 服务启动超时"
            return 1
        fi
        sleep 2
    done
    
    # 执行配置脚本
    if [ "$is_local" = "true" ]; then
        ./scripts/configure-jc21-path-based-fixed.sh --create-local
    else
        ./scripts/configure-jc21-path-based-fixed.sh --create
    fi
    
    log_success "JC21 代理配置完成"
}

# 测试服务
test_services() {
    log_info "测试服务..."
    
    local tests=(
        "http://localhost/"
        "http://localhost/api/health"
        "http://localhost/directus/"
    )
    
    for url in "${tests[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        if [ "$response" = "200" ] || [ "$response" = "404" ]; then
            log_success "$url: HTTP $response"
        else
            log_warning "$url: HTTP $response"
        fi
    done
}

# 显示部署信息
show_deployment_info() {
    local domain="$1"
    local is_local="$2"
    
    echo
    echo "=========================================="
    echo "🎉 生产环境部署完成！"
    echo "=========================================="
    echo
    echo "🌐 访问地址:"
    echo "   主域名: $domain"
    echo
    echo "📋 服务配置:"
    echo "   / → 前端静态页面 (frontend:80)"
    echo "   /api/* → API 服务 (api:3000)"
    echo "   /directus/* → Directus 服务 (directus:8055)"
    echo "   /admin/* → Directus 管理界面 (directus:8055)"
    echo
    echo "🔧 服务访问:"
    if [ "$is_local" = "true" ]; then
        echo "   前端: http://$domain"
        echo "   API: http://$domain/api"
        echo "   Directus: http://$domain/directus"
        echo "   管理界面: http://$domain/admin"
    else
        echo "   前端: https://$domain"
        echo "   API: https://$domain/api"
        echo "   Directus: https://$domain/directus"
        echo "   管理界面: https://$domain/admin"
    fi
    echo "   JC21 管理: http://localhost:81"
    echo
    echo "📊 管理命令:"
    echo "   查看状态: $0 --status"
    echo "   查看日志: $0 --logs"
    echo "   重新配置: $0 --configure"
    echo "   清理环境: $0 --clean"
    echo
    echo "⚠️  注意事项:"
    if [ "$is_local" = "true" ]; then
        echo "   - 本地测试环境，不要申请 SSL 证书"
        echo "   - 使用 localhost 访问"
    else
        echo "   - 生产环境，建议启用 SSL 证书"
        echo "   - 确保域名 DNS 配置正确"
    fi
    echo "=========================================="
}

# 显示服务状态
show_status() {
    log_info "服务状态:"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo
    log_info "网络状态:"
    docker network ls | grep avatar-mgmt || echo "无相关网络"
}

# 显示服务日志
show_logs() {
    log_info "显示服务日志 (最近 20 行):"
    docker compose -f "$COMPOSE_FILE" logs --tail=20
}

# 完整部署
deploy_production() {
    local domain="$1"
    local is_local="${2:-false}"
    
    log_info "开始生产环境部署..."
    
    # 检查环境
    check_docker
    check_files
    
    # 清理环境
    clean_environment
    
    # 启动服务
    start_services
    
    # 检查服务状态
    check_services
    
    # 配置代理
    configure_proxy "$domain" "$is_local"
    
    # 测试服务
    test_services
    
    # 显示部署信息
    show_deployment_info "$domain" "$is_local"
}

# 主函数
main() {
    case "${1:-}" in
        --deploy|-d)
            deploy_production "$DOMAIN" "false"
            ;;
        --deploy-local|-dl)
            deploy_production "$LOCAL_DOMAIN" "true"
            ;;
        --clean|-c)
            clean_environment
            log_success "环境清理完成"
            ;;
        --status|-s)
            show_status
            ;;
        --logs|-l)
            show_logs
            ;;
        --configure|-cf)
            check_docker
            check_files
            configure_proxy "$DOMAIN" "false"
            ;;
        --help|-h)
            show_help
            ;;
        *)
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 
