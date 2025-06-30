#!/bin/bash

# jc21 Nginx Proxy Manager 自动化配置脚本 (Shell 版本)
# ======================================================

set -e

# 配置变量
DB_PATH="./jc21/data/database.sqlite"
DOMAIN="daidai.amis.hk"
API_DOMAIN="api.daidai.amis.hk"
ADMIN_DOMAIN="admin.daidai.amis.hk"

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

# 检查 SQLite 是否可用
check_sqlite() {
    if ! command -v sqlite3 &> /dev/null; then
        log_error "SQLite3 未安装，请先安装 SQLite3"
        log_info "Ubuntu/Debian: sudo apt-get install sqlite3"
        log_info "CentOS/RHEL: sudo yum install sqlite"
        log_info "macOS: brew install sqlite3"
        exit 1
    fi
}

# 检查数据库文件是否存在
check_database() {
    if [ ! -f "$DB_PATH" ]; then
        log_error "数据库文件不存在: $DB_PATH"
        log_info "请确保 jc21 服务已启动并初始化"
        exit 1
    fi
}

# 显示当前代理主机配置
list_proxy_hosts() {
    log_info "显示当前代理主机配置..."
    
    sqlite3 "$DB_PATH" "
        SELECT 
            id,
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            ssl_forced,
            websockets_support,
            block_exploits,
            created_on
        FROM proxy_hosts 
        ORDER BY created_on DESC;
    " | while IFS='|' read -r id domain host port scheme ssl ws block created; do
        echo "ID: $id"
        echo "  域名: $domain"
        echo "  目标: $scheme://$host:$port"
        echo "  SSL强制: $([ "$ssl" = "1" ] && echo "是" || echo "否")"
        echo "  WebSocket: $([ "$ws" = "1" ] && echo "是" || echo "否")"
        echo "  防攻击: $([ "$block" = "1" ] && echo "是" || echo "否")"
        echo "  创建时间: $created"
        echo "  $(printf '%.60s' '----------------------------------------')"
    done
}

# 创建代理主机
create_proxy_host() {
    local domain_names="$1"
    local forward_host="$2"
    local forward_port="$3"
    local forward_scheme="${4:-http}"
    local ssl_forced="${5:-0}"
    local websockets_support="${6:-1}"
    local block_exploits="${7:-1}"
    local advanced_config="${8:-}"
    
    local now=$(date -u +"%Y-%m-%d %H:%M:%S")
    
    log_info "创建代理主机: $domain_names -> $forward_scheme://$forward_host:$forward_port"
    
    sqlite3 "$DB_PATH" "
        INSERT INTO proxy_hosts (
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            ssl_forced,
            websockets_support,
            block_exploits,
            advanced_config,
            created_on,
            modified_on
        ) VALUES (
            '$domain_names',
            '$forward_host',
            $forward_port,
            '$forward_scheme',
            $ssl_forced,
            $websockets_support,
            $block_exploits,
            '$advanced_config',
            '$now',
            '$now'
        );
    "
    
    local id=$(sqlite3 "$DB_PATH" "SELECT last_insert_rowid();")
    log_success "代理主机创建成功，ID: $id"
    return $id
}

# 删除代理主机
delete_proxy_host() {
    local id="$1"
    
    log_info "删除代理主机 ID: $id"
    
    # 先删除相关的位置配置
    sqlite3 "$DB_PATH" "DELETE FROM proxy_host_locations WHERE proxy_host_id = $id;"
    
    # 删除代理主机
    sqlite3 "$DB_PATH" "DELETE FROM proxy_hosts WHERE id = $id;"
    
    log_success "代理主机删除成功"
}

# 更新代理主机
update_proxy_host() {
    local id="$1"
    local domain_names="$2"
    local forward_host="$3"
    local forward_port="$4"
    local forward_scheme="${5:-http}"
    local ssl_forced="${6:-0}"
    local websockets_support="${7:-1}"
    local block_exploits="${8:-1}"
    local advanced_config="${9:-}"
    
    local now=$(date -u +"%Y-%m-%d %H:%M:%S")
    
    log_info "更新代理主机 ID: $id"
    
    sqlite3 "$DB_PATH" "
        UPDATE proxy_hosts SET
            domain_names = '$domain_names',
            forward_host = '$forward_host',
            forward_port = $forward_port,
            forward_scheme = '$forward_scheme',
            ssl_forced = $ssl_forced,
            websockets_support = $websockets_support,
            block_exploits = $block_exploits,
            advanced_config = '$advanced_config',
            modified_on = '$now'
        WHERE id = $id;
    "
    
    log_success "代理主机更新成功"
}

# 配置 SSL 证书
configure_ssl() {
    local proxy_host_id="$1"
    local ssl_forced="${2:-1}"
    local http2_support="${3:-1}"
    local hsts_enabled="${4:-1}"
    local hsts_subdomains="${5:-1}"
    
    log_info "配置 SSL 证书，代理主机 ID: $proxy_host_id"
    
    sqlite3 "$DB_PATH" "
        UPDATE proxy_hosts SET
            ssl_forced = $ssl_forced,
            http2_support = $http2_support,
            hsts_enabled = $hsts_enabled,
            hsts_subdomains = $hsts_subdomains
        WHERE id = $proxy_host_id;
    "
    
    log_success "SSL 配置更新成功"
}

# 创建默认配置
create_default_configs() {
    log_info "创建默认代理配置..."
    
    # 1. API 服务配置
    log_info "配置 API 服务..."
    local api_advanced_config="
# API 服务自定义配置
client_max_body_size 10M;
proxy_read_timeout 300s;
proxy_connect_timeout 75s;
proxy_send_timeout 300s;
"
    create_proxy_host "$API_DOMAIN" "api" 3000 "http" 1 1 1 "$api_advanced_config"
    local api_id=$?
    
    # 2. Directus 管理界面配置
    log_info "配置 Directus 管理界面..."
    create_proxy_host "$ADMIN_DOMAIN" "directus" 8055 "http" 1 1 1 ""
    local admin_id=$?
    
    # 3. 前端应用配置
    log_info "配置前端应用..."
    create_proxy_host "$DOMAIN" "frontend" 80 "http" 1 0 1 ""
    local frontend_id=$?
    
    log_success "默认配置创建完成"
    log_info "API 服务 ID: $api_id"
    log_info "Directus 管理界面 ID: $admin_id"
    log_info "前端应用 ID: $frontend_id"
}

# 创建本地测试配置
create_local_configs() {
    log_info "创建本地测试配置..."
    
    # 1. API 服务配置 (本地)
    log_info "配置 API 服务 (本地)..."
    create_proxy_host "localhost" "api" 3000 "http" 0 1 1 ""
    local api_id=$?
    
    # 2. Directus 管理界面配置 (本地)
    log_info "配置 Directus 管理界面 (本地)..."
    create_proxy_host "localhost" "directus" 8055 "http" 0 1 1 ""
    local admin_id=$?
    
    log_success "本地测试配置创建完成"
    log_info "API 服务 ID: $api_id"
    log_info "Directus 管理界面 ID: $admin_id"
}

# 备份数据库
backup_database() {
    local backup_path="./jc21/data/database-backup-$(date +%Y%m%d-%H%M%S).sqlite"
    
    log_info "备份数据库到: $backup_path"
    cp "$DB_PATH" "$backup_path"
    log_success "数据库备份完成"
}

# 恢复数据库
restore_database() {
    local backup_path="$1"
    
    if [ ! -f "$backup_path" ]; then
        log_error "备份文件不存在: $backup_path"
        exit 1
    fi
    
    log_info "从备份恢复数据库: $backup_path"
    cp "$backup_path" "$DB_PATH"
    log_success "数据库恢复完成"
}

# 显示帮助信息
show_help() {
    echo "
jc21 代理配置脚本 (Shell 版本)

用法:
  $0 [选项] [参数]

选项:
  --list, -l                   显示当前代理配置
  --create, -c                 创建默认配置
  --create-local, -cl          创建本地测试配置
  --delete <id>                删除指定ID的代理主机
  --update <id> <domain> <host> <port> [scheme] [ssl] [ws] [block]
                               更新代理主机配置
  --ssl <id> [forced] [http2] [hsts] [hsts_sub]
                               配置 SSL 证书
  --backup                     备份数据库
  --restore <backup_path>      从备份恢复数据库
  --help, -h                   显示帮助信息

示例:
  $0 --list
  $0 --create
  $0 --create-local
  $0 --delete 1
  $0 --update 1 api.example.com api 3000 http 1 1 1
  $0 --ssl 1 1 1 1 1
  $0 --backup
  $0 --restore ./jc21/data/database-backup-20250101-120000.sqlite

环境变量:
  DOMAIN          主域名 (默认: daidai.amis.hk)
  API_DOMAIN      API 域名 (默认: api.daidai.amis.hk)
  ADMIN_DOMAIN    管理界面域名 (默认: admin.daidai.amis.hk)
  DB_PATH         数据库路径 (默认: ./jc21/data/database.sqlite)
"
}

# 主函数
main() {
    # 检查前置条件
    check_sqlite
    check_database
    
    # 解析命令行参数
    case "${1:-}" in
        --list|-l)
            list_proxy_hosts
            ;;
        --create|-c)
            backup_database
            create_default_configs
            list_proxy_hosts
            ;;
        --create-local|-cl)
            backup_database
            create_local_configs
            list_proxy_hosts
            ;;
        --delete)
            if [ -z "$2" ]; then
                log_error "请提供要删除的代理主机 ID"
                exit 1
            fi
            delete_proxy_host "$2"
            list_proxy_hosts
            ;;
        --update)
            if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ] || [ -z "$5" ]; then
                log_error "请提供完整的更新参数"
                exit 1
            fi
            update_proxy_host "$2" "$3" "$4" "$5" "${6:-http}" "${7:-0}" "${8:-1}" "${9:-1}"
            list_proxy_hosts
            ;;
        --ssl)
            if [ -z "$2" ]; then
                log_error "请提供代理主机 ID"
                exit 1
            fi
            configure_ssl "$2" "${3:-1}" "${4:-1}" "${5:-1}" "${6:-1}"
            ;;
        --backup)
            backup_database
            ;;
        --restore)
            if [ -z "$2" ]; then
                log_error "请提供备份文件路径"
                exit 1
            fi
            restore_database "$2"
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
