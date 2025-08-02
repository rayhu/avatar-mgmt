#!/bin/bash

# JC21 完整配置脚本
# 基于 docker-compose.prod-simple.yml 自动配置
# ======================================

set -e

# 配置变量
DB_PATH="./jc21/data/database.sqlite"
DOMAIN="${DOMAIN:-daidai.amis.hk}"
LOCAL_DOMAIN="${LOCAL_DOMAIN:-localhost}"
IS_LOCAL="${IS_LOCAL:-false}"

# 服务配置（基于 docker-compose.prod-simple.yml）
SERVICES=(
    "frontend:80:http"
    "api:3000:http"
    "directus:8055:http"
)

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
JC21 完整配置脚本

用法:
  $0 [选项]

选项:
  --create, -c             创建生产环境配置
  --create-local, -cl      创建本地测试配置
  --list, -l               列出当前配置
  --delete, -d             删除所有配置
  --test, -t               测试服务连接
  --help, -h               显示帮助信息

环境变量:
  DOMAIN          生产环境域名 (默认: daidai.amis.hk)
  LOCAL_DOMAIN    本地测试域名 (默认: localhost)
  IS_LOCAL        是否为本地环境 (true/false)

示例:
  $0 --create
  $0 --create-local
  $0 --list
  DOMAIN=example.com $0 --create
"
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

# 备份数据库
backup_database() {
    local backup_path="./jc21/data/database-backup-$(date +%Y%m%d-%H%M%S).sqlite"
    log_info "备份数据库到: $backup_path"
    cp "$DB_PATH" "$backup_path"
    log_success "数据库备份完成"
}

# 删除所有配置
delete_all_configs() {
    log_info "删除所有 JC21 配置..."
    
    # 删除所有代理主机
    sqlite3 "$DB_PATH" "DELETE FROM proxy_host;"
    log_success "所有配置已删除"
}

# 创建路径分离配置
create_path_based_config() {
    local domain="$1"
    local is_local="${2:-false}"
    
    log_info "创建路径分离配置: $domain"
    
    # 备份数据库
    backup_database
    
    # 删除现有配置
    delete_all_configs
    
    # 构建 locations JSON
    local locations_json='[
        {
            "path": "/api",
            "advanced_config": "",
            "forward_scheme": "http",
            "forward_host": "api",
            "forward_port": 3000
        },
        {
            "path": "/directus",
            "advanced_config": "",
            "forward_scheme": "http",
            "forward_host": "directus",
            "forward_port": 8055
        },
        {
            "path": "/admin",
            "advanced_config": "",
            "forward_scheme": "http",
            "forward_host": "directus",
            "forward_port": 8055
        }
    ]'
    
    # 构建高级配置
    local advanced_config='# 路径分离配置 - 基于 docker-compose.prod-simple.yml

# API 服务配置 (api:3000)
location /api/ {
    proxy_pass http://api:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # API 特定配置
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
    client_max_body_size 10M;
    
    # 健康检查
    proxy_intercept_errors on;
    error_page 502 503 504 = @api_fallback;
}

# Directus 服务配置 (directus:8055)
location /directus/ {
    proxy_pass http://directus:8055/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Directus 特定配置
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
    client_max_body_size 50M;
    
    # WebSocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Directus 管理界面配置 (directus:8055)
location /admin/ {
    proxy_pass http://directus:8055/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Directus 管理界面特定配置
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
    client_max_body_size 50M;
    
    # WebSocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# 前端静态文件配置 (frontend:80)
location / {
    try_files $uri $uri/ /index.html;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# API 服务降级处理
location @api_fallback {
    return 503 "{\"error\":\"API service temporarily unavailable\"}";
    add_header Content-Type application/json;
}'
    
    # 插入主代理主机
    sqlite3 "$DB_PATH" "
        INSERT INTO proxy_host (
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            ssl_forced,
            allow_websocket_upgrade,
            block_exploits,
            advanced_config,
            locations,
            created_on,
            modified_on,
            owner_user_id,
            is_deleted,
            access_list_id,
            certificate_id,
            caching_enabled,
            meta,
            http2_support,
            enabled,
            hsts_enabled,
            hsts_subdomains
        ) VALUES (
            '[\"$domain\"]',
            'frontend',
            80,
            'http',
            0,
            1,
            1,
            '$advanced_config',
            '$locations_json',
            datetime('now'),
            datetime('now'),
            1,
            0,
            0,
            0,
            0,
            '{}',
            0,
            1,
            0,
            0
        );
    "
    
    local main_proxy_id=$(sqlite3 "$DB_PATH" "SELECT last_insert_rowid();")
    log_success "主代理主机创建成功，ID: $main_proxy_id"
    
    return $main_proxy_id
}

# 创建子域名配置
create_subdomain_config() {
    local domain="$1"
    local is_local="${2:-false}"
    
    log_info "创建子域名配置: $domain"
    
    # 备份数据库
    backup_database
    
    # 删除现有配置
    delete_all_configs
    
    # 1. 前端配置
    log_info "配置前端服务..."
    sqlite3 "$DB_PATH" "
        INSERT INTO proxy_host (
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            ssl_forced,
            allow_websocket_upgrade,
            block_exploits,
            advanced_config,
            created_on,
            modified_on,
            owner_user_id,
            is_deleted,
            access_list_id,
            certificate_id,
            caching_enabled,
            meta,
            http2_support,
            enabled,
            hsts_enabled,
            hsts_subdomains
        ) VALUES (
            '[\"$domain\"]',
            'frontend',
            80,
            'http',
            0,
            0,
            1,
            'location / { try_files \$uri \$uri/ /index.html; }',
            datetime('now'),
            datetime('now'),
            1,
            0,
            0,
            0,
            0,
            '{}',
            0,
            1,
            0,
            0
        );
    "
    
    # 2. API 配置
    log_info "配置 API 服务..."
    sqlite3 "$DB_PATH" "
        INSERT INTO proxy_host (
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            ssl_forced,
            allow_websocket_upgrade,
            block_exploits,
            advanced_config,
            created_on,
            modified_on,
            owner_user_id,
            is_deleted,
            access_list_id,
            certificate_id,
            caching_enabled,
            meta,
            http2_support,
            enabled,
            hsts_enabled,
            hsts_subdomains
        ) VALUES (
            '[\"api.$domain\"]',
            'api',
            3000,
            'http',
            0,
            1,
            1,
            'client_max_body_size 10M; proxy_read_timeout 300s;',
            datetime('now'),
            datetime('now'),
            1,
            0,
            0,
            0,
            0,
            '{}',
            0,
            1,
            0,
            0
        );
    "
    
    # 3. Directus 配置
    log_info "配置 Directus 服务..."
    sqlite3 "$DB_PATH" "
        INSERT INTO proxy_host (
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            ssl_forced,
            allow_websocket_upgrade,
            block_exploits,
            advanced_config,
            created_on,
            modified_on,
            owner_user_id,
            is_deleted,
            access_list_id,
            certificate_id,
            caching_enabled,
            meta,
            http2_support,
            enabled,
            hsts_enabled,
            hsts_subdomains
        ) VALUES (
            '[\"admin.$domain\"]',
            'directus',
            8055,
            'http',
            0,
            1,
            1,
            'client_max_body_size 50M; proxy_read_timeout 300s;',
            datetime('now'),
            datetime('now'),
            1,
            0,
            0,
            0,
            0,
            '{}',
            0,
            1,
            0,
            0
        );
    "
    
    log_success "子域名配置创建完成"
}

# 列出当前配置
list_configs() {
    log_info "当前 JC21 配置:"
    echo
    
    sqlite3 "$DB_PATH" "
        SELECT 
            id,
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            ssl_forced,
            enabled
        FROM proxy_host 
        WHERE is_deleted = 0
        ORDER BY id;
    " | while IFS='|' read -r id domain host port scheme ssl enabled; do
        echo "ID: $id"
        echo "  域名: $domain"
        echo "  目标: $host:$port ($scheme)"
        echo "  SSL: $([ \"$ssl\" = \"1\" ] && echo \"启用\" || echo \"禁用\")"
        echo "  状态: $([ \"$enabled\" = \"1\" ] && echo \"启用\" || echo \"禁用\")"
        echo
    done
}

# 测试服务连接
test_services() {
    log_info "测试服务连接..."
    
    local tests=(
        "http://localhost/"
        "http://localhost/api/health"
        "http://localhost/directus/"
        "http://localhost/admin/"
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

# 重新加载 Nginx 配置
reload_nginx() {
    log_info "重新加载 Nginx 配置..."
    if docker compose -f docker-compose.prod-simple.yml exec nginx-proxy-manager nginx -s reload >/dev/null 2>&1; then
        log_success "Nginx 配置重新加载成功"
    else
        log_warning "Nginx 配置重新加载失败，请手动检查"
    fi
}

# 显示配置信息
show_config_info() {
    local domain="$1"
    local is_local="$2"
    local config_type="$3"
    
    echo
    echo "=========================================="
    echo "🎉 JC21 配置完成！"
    echo "=========================================="
    echo
    echo "🌐 配置类型: $config_type"
    echo "   主域名: $domain"
    echo
    echo "📋 服务配置:"
    echo "   前端服务: frontend:80"
    echo "   API 服务: api:3000"
    echo "   Directus 服务: directus:8055"
    echo
    echo "🔧 访问地址:"
    if [ "$config_type" = "路径分离" ]; then
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
    else
        if [ "$is_local" = "true" ]; then
            echo "   前端: http://$domain"
            echo "   API: http://api.$domain"
            echo "   管理界面: http://admin.$domain"
        else
            echo "   前端: https://$domain"
            echo "   API: https://api.$domain"
            echo "   管理界面: https://admin.$domain"
        fi
    fi
    echo "   JC21 管理: http://localhost:81"
    echo
    echo "📊 管理命令:"
    echo "   查看配置: $0 --list"
    echo "   测试服务: $0 --test"
    echo "   删除配置: $0 --delete"
    echo "   重新加载: docker compose exec nginx-proxy-manager nginx -s reload"
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

# 主函数
main() {
    case "${1:-}" in
        --create|-c)
            check_sqlite
            check_database
            create_path_based_config "$DOMAIN" "false"
            reload_nginx
            show_config_info "$DOMAIN" "false" "路径分离"
            ;;
        --create-local|-cl)
            check_sqlite
            check_database
            create_path_based_config "$LOCAL_DOMAIN" "true"
            reload_nginx
            show_config_info "$LOCAL_DOMAIN" "true" "路径分离"
            ;;
        --create-subdomain|-cs)
            check_sqlite
            check_database
            create_subdomain_config "$DOMAIN" "false"
            reload_nginx
            show_config_info "$DOMAIN" "false" "子域名"
            ;;
        --list|-l)
            check_sqlite
            check_database
            list_configs
            ;;
        --delete|-d)
            check_sqlite
            check_database
            delete_all_configs
            reload_nginx
            log_success "所有配置已删除"
            ;;
        --test|-t)
            test_services
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
