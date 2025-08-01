#!/bin/bash

# Docker 环境下 jc21 自动化配置部署脚本
# ==========================================

set -e

# 配置变量
COMPOSE_FILE="docker-compose.prod-simple.yml"
DOMAIN="${DOMAIN:-daidai.amis.hk}"
API_DOMAIN="${API_DOMAIN:-api.daidai.amis.hk}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.daidai.amis.hk}"
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
Docker 环境下 jc21 自动化配置部署脚本

用法:
  $0 [选项]

选项:
  --start, -s              启动 jc21 服务
  --stop, -st              停止 jc21 服务
  --restart, -r            重启 jc21 服务
  --status, -st            查看服务状态
  --configure, -c          配置代理主机
  --configure-local, -cl   配置本地测试代理主机
  --backup, -b             备份配置
  --restore <file>, -rs    恢复配置
  --logs, -l               查看日志
  --test, -t               运行测试
  --help, -h               显示帮助信息

环境变量:
  DOMAIN          主域名 (默认: daidai.amis.hk)
  API_DOMAIN      API 域名 (默认: api.daidai.amis.hk)
  ADMIN_DOMAIN    管理界面域名 (默认: admin.daidai.amis.hk)
  COMPOSE_FILE    Docker Compose 文件 (默认: docker-compose.prod-simple.yml)

示例:
  $0 --start
  $0 --configure
  $0 --configure-local
  $0 --test
  DOMAIN=example.com $0 --configure
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

# 启动 jc21 服务
start_jc21() {
    log_info "启动 jc21 服务..."
    
    # 创建必要目录
    mkdir -p ./jc21/data/mysql
    mkdir -p ./jc21/letsencrypt
    
    # 启动服务
    docker compose -f $COMPOSE_FILE up -d nginx-proxy-manager nginx-proxy-manager-db
    
    # 等待服务启动
    log_info "等待服务启动..."
    for i in {1..60}; do
        if curl -s http://localhost:81 >/dev/null 2>&1; then
            log_success "jc21 服务启动成功"
            break
        fi
        if [ $i -eq 60 ]; then
            log_error "jc21 服务启动超时"
            exit 1
        fi
        sleep 2
    done
}

# 停止 jc21 服务
stop_jc21() {
    log_info "停止 jc21 服务..."
    docker compose -f $COMPOSE_FILE stop nginx-proxy-manager nginx-proxy-manager-db
    log_success "jc21 服务已停止"
}

# 重启 jc21 服务
restart_jc21() {
    log_info "重启 jc21 服务..."
    docker compose -f $COMPOSE_FILE restart nginx-proxy-manager nginx-proxy-manager-db
    
    # 等待服务重启
    log_info "等待服务重启..."
    for i in {1..30}; do
        if curl -s http://localhost:81 >/dev/null 2>&1; then
            log_success "jc21 服务重启成功"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "jc21 服务重启超时"
            exit 1
        fi
        sleep 2
    done
}

# 查看服务状态
show_status() {
    log_info "查看服务状态..."
    docker compose -f $COMPOSE_FILE ps
    
    echo
    log_info "服务访问信息:"
    echo "  jc21 管理界面: http://localhost:81"
    echo "  默认邮箱: admin@example.com"
    echo "  默认密码: changeme"
}

# 配置代理主机
configure_proxy() {
    log_info "配置代理主机..."
    
    # 检查服务是否运行
    if ! docker compose -f $COMPOSE_FILE ps | grep -q "nginx-proxy-manager.*Up"; then
        log_error "jc21 服务未运行，请先启动服务"
        exit 1
    fi
    
    # 检查数据库文件
    if [ ! -f "$DB_PATH" ]; then
        log_error "数据库文件不存在，请确保服务已正确初始化"
        exit 1
    fi
    
    # 备份当前配置
    ./scripts/configure-jc21-proxy.sh --backup
    
    # 创建配置
    if [ "$1" = "local" ]; then
        log_info "创建本地测试配置..."
        ./scripts/configure-jc21-proxy.sh --create-local
    else
        log_info "创建生产环境配置..."
        ./scripts/configure-jc21-proxy.sh --create
    fi
    
    # 重新加载 Nginx 配置
    log_info "重新加载 Nginx 配置..."
    docker compose -f $COMPOSE_FILE exec nginx-proxy-manager nginx -s reload >/dev/null 2>&1
    
    log_success "代理主机配置完成"
}

# 备份配置
backup_config() {
    log_info "备份配置..."
    
    if [ ! -f "$DB_PATH" ]; then
        log_error "数据库文件不存在"
        exit 1
    fi
    
    ./scripts/configure-jc21-proxy.sh --backup
    log_success "配置备份完成"
}

# 恢复配置
restore_config() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "请指定备份文件路径"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_info "恢复配置: $backup_file"
    ./scripts/configure-jc21-proxy.sh --restore "$backup_file"
    
    # 重新加载 Nginx 配置
    docker compose -f $COMPOSE_FILE exec nginx-proxy-manager nginx -s reload >/dev/null 2>&1
    
    log_success "配置恢复完成"
}

# 查看日志
show_logs() {
    log_info "查看 jc21 服务日志..."
    docker compose -f $COMPOSE_FILE logs -f nginx-proxy-manager
}

# 运行测试
run_test() {
    log_info "运行 Docker 环境测试..."
    ./scripts/test-docker-jc21.sh
}

# 显示配置信息
show_config_info() {
    echo
    echo "=========================================="
    echo "🎉 jc21 Docker 环境配置完成！"
    echo "=========================================="
    echo
    echo "🌐 访问信息:"
    echo "   jc21 管理界面: http://localhost:81"
    echo "   默认邮箱: admin@example.com"
    echo "   默认密码: changeme"
    echo
    echo "📋 当前配置:"
    echo "   主域名: $DOMAIN"
    echo "   API 域名: $API_DOMAIN"
    echo "   管理界面域名: $ADMIN_DOMAIN"
    echo
    echo "🔧 管理命令:"
    echo "   查看状态: $0 --status"
    echo "   查看日志: $0 --logs"
    echo "   重启服务: $0 --restart"
    echo "   停止服务: $0 --stop"
    echo
    echo "📊 配置管理:"
    echo "   查看配置: ./scripts/configure-jc21-proxy.sh --list"
    echo "   备份配置: $0 --backup"
    echo "   恢复配置: $0 --restore <backup_file>"
    echo
    echo "🧪 测试:"
    echo "   运行测试: $0 --test"
    echo
    echo "📚 文档: scripts/README-jc21-config.md"
    echo "=========================================="
}

# 主函数
main() {
    case "${1:-}" in
        --start|-s)
            check_docker
            start_jc21
            show_config_info
            ;;
        --stop|-st)
            check_docker
            stop_jc21
            ;;
        --restart|-r)
            check_docker
            restart_jc21
            show_config_info
            ;;
        --status)
            check_docker
            show_status
            ;;
        --configure|-c)
            check_docker
            configure_proxy
            show_config_info
            ;;
        --configure-local|-cl)
            check_docker
            configure_proxy local
            show_config_info
            ;;
        --backup|-b)
            check_docker
            backup_config
            ;;
        --restore|-rs)
            check_docker
            restore_config "$2"
            ;;
        --logs|-l)
            check_docker
            show_logs
            ;;
        --test|-t)
            check_docker
            run_test
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
