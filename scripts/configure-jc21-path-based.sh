#!/bin/bash

# jc21 路径分离配置脚本
# 实现单域名多路径的反向代理配置
# ======================================

set -e

# 配置变量
DB_PATH="./jc21/data/database.sqlite"
DOMAIN="${DOMAIN:-daidai.amis.hk}"
LOCAL_DOMAIN="${LOCAL_DOMAIN:-localhost}"

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

# 备份数据库
backup_database() {
    local backup_path="./jc21/data/database-backup-$(date +%Y%m%d-%H%M%S).sqlite"
    log_info "备份数据库到: $backup_path"
    cp "$DB_PATH" "$backup_path"
    log_success "数据库备份完成"
}

# 创建路径分离配置
create_path_based_config() {
    local domain="$1"
    local is_local="${2:-false}"
    
    log_info "创建路径分离配置: $domain"
    
    # 备份数据库
    backup_database
    
    # 1. 创建主代理主机（前端静态页面）
    log_info "配置前端静态页面 (/)..."
    local frontend_advanced_config=""
    if [ "$is_local" = "true" ]; then
        frontend_advanced_config="
# 本地测试配置
location / {
    try_files \$uri \$uri/ /index.html;
}
"
    fi
    
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
            '$domain',
            'frontend',
            80,
            'http',
            0,
            0,
            1,
            '$frontend_advanced_config',
            datetime('now'),
            datetime('now')
        );
    "
    
    local main_proxy_id=$(sqlite3 "$DB_PATH" "SELECT last_insert_rowid();")
    log_success "前端代理主机创建成功，ID: $main_proxy_id"
    
    # 2. 创建 API 路径配置
    log_info "配置 API 服务 (/api)..."
    sqlite3 "$DB_PATH" "
        INSERT INTO proxy_host_locations (
            proxy_host_id,
            path,
            forward_host,
            forward_port,
            forward_scheme
        ) VALUES (
            $main_proxy_id,
            '/api',
            'api',
            3000,
            'http'
        );
    "
    log_success "API 路径配置创建成功"
    
    # 3. 创建 Directus 路径配置
    log_info "配置 Directus 服务 (/directus)..."
    sqlite3 "$DB_PATH" "
        INSERT INTO proxy_host_locations (
            proxy_host_id,
            path,
            forward_host,
            forward_port,
            forward_scheme
        ) VALUES (
            $main_proxy_id,
            '/directus',
            'directus',
            8055,
            'http'
        );
    "
    log_success "Directus 路径配置创建成功"
    
    # 4. 创建 Directus 管理界面路径配置
    log_info "配置 Directus 管理界面 (/admin)..."
    sqlite3 "$DB_PATH" "
        INSERT INTO proxy_host_locations (
            proxy_host_id,
            path,
            forward_host,
            forward_port,
            forward_scheme
        ) VALUES (
            $main_proxy_id,
            '/admin',
            'directus',
            8055,
            'http'
        );
    "
    log_success "Directus 管理界面路径配置创建成功"
    
    # 5. 添加高级配置
    log_info "添加高级 Nginx 配置..."
    local advanced_config="
# 路径分离配置
location /api/ {
    proxy_pass http://api:3000/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    
    # API 特定配置
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
    client_max_body_size 10M;
}

location /directus/ {
    proxy_pass http://directus:8055/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    
    # Directus 特定配置
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
    client_max_body_size 50M;
}

location /admin/ {
    proxy_pass http://directus:8055/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    
    # Directus 管理界面特定配置
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;
    client_max_body_size 50M;
}

# 前端静态文件配置
location / {
    try_files \$uri \$uri/ /index.html;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}
"
    
    # 更新主代理主机的高级配置
    sqlite3 "$DB_PATH" "
        UPDATE proxy_hosts 
        SET advanced_config = '$advanced_config'
        WHERE id = $main_proxy_id;
    "
    
    log_success "高级配置更新完成"
    
    return $main_proxy_id
}

# 显示配置信息
show_config_info() {
    local domain="$1"
    local is_local="$2"
    
    echo
    echo "=========================================="
    echo "🎉 路径分离配置完成！"
    echo "=========================================="
    echo
    echo "🌐 访问地址:"
    echo "   主域名: $domain"
    echo
    echo "📋 路径配置:"
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
    echo
    echo "📊 管理命令:"
    echo "   查看配置: ./scripts/configure-jc21-proxy.sh --list"
    echo "   重新加载: docker compose exec nginx-proxy-manager nginx -s reload"
    echo "   查看日志: docker compose logs nginx-proxy-manager"
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

# 重新加载 Nginx 配置
reload_nginx() {
    log_info "重新加载 Nginx 配置..."
    if docker compose -f docker-compose.prod-simple.yml exec nginx-proxy-manager nginx -s reload >/dev/null 2>&1; then
        log_success "Nginx 配置重新加载成功"
    else
        log_warning "Nginx 配置重新加载失败，请手动检查"
    fi
}

# 显示帮助信息
show_help() {
    echo "
jc21 路径分离配置脚本

用法:
  $0 [选项]

选项:
  --create, -c             创建生产环境路径分离配置
  --create-local, -cl      创建本地测试路径分离配置
  --domain <domain>        指定域名 (默认: daidai.amis.hk)
  --local-domain <domain>  指定本地域名 (默认: localhost)
  --help, -h               显示帮助信息

环境变量:
  DOMAIN          生产环境域名 (默认: daidai.amis.hk)
  LOCAL_DOMAIN    本地测试域名 (默认: localhost)

示例:
  $0 --create
  $0 --create-local
  DOMAIN=example.com $0 --create
  LOCAL_DOMAIN=test.local $0 --create-local
"
}

# 主函数
main() {
    case "${1:-}" in
        --create|-c)
            check_sqlite
            check_database
            create_path_based_config "$DOMAIN" "false"
            reload_nginx
            show_config_info "$DOMAIN" "false"
            ;;
        --create-local|-cl)
            check_sqlite
            check_database
            create_path_based_config "$LOCAL_DOMAIN" "true"
            reload_nginx
            show_config_info "$LOCAL_DOMAIN" "true"
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            main "$@"
            ;;
        --local-domain)
            LOCAL_DOMAIN="$2"
            shift 2
            main "$@"
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
