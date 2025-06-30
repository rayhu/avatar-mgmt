#!/bin/bash

# Docker 环境下 jc21 配置脚本测试
# ======================================

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

# 检查 Docker 环境
check_docker_environment() {
    log_info "检查 Docker 环境..."
    
    # 检查 Docker 是否运行
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker 未运行，请启动 Docker"
        exit 1
    fi
    
    # 检查 Docker Compose 是否可用
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "Docker 环境检查通过"
}

# 检查 jc21 服务状态
check_jc21_service() {
    log_info "检查 jc21 服务状态..."
    
    # 检查容器是否运行
    if ! docker compose -f docker-compose.prod-simple.yml ps | grep -q "nginx-proxy-manager.*Up"; then
        log_warning "jc21 服务未运行，正在启动..."
        docker compose -f docker-compose.prod-simple.yml up -d nginx-proxy-manager nginx-proxy-manager-db
        sleep 10
    fi
    
    # 等待服务完全启动
    log_info "等待 jc21 服务完全启动..."
    for i in {1..30}; do
        if curl -s http://localhost:81 >/dev/null 2>&1; then
            log_success "jc21 服务已启动"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "jc21 服务启动超时"
            exit 1
        fi
        sleep 2
    done
}

# 检查数据库文件
check_database_file() {
    log_info "检查数据库文件..."
    
    local db_path="./jc21/data/database.sqlite"
    
    if [ ! -f "$db_path" ]; then
        log_error "数据库文件不存在: $db_path"
        log_info "请确保 jc21 服务已正确初始化"
        exit 1
    fi
    
    # 检查文件权限
    if [ ! -r "$db_path" ] || [ ! -w "$db_path" ]; then
        log_error "数据库文件权限不足"
        log_info "当前权限: $(ls -la $db_path)"
        exit 1
    fi
    
    log_success "数据库文件检查通过"
}

# 测试数据库连接
test_database_connection() {
    log_info "测试数据库连接..."
    
    if ! command -v sqlite3 &> /dev/null; then
        log_error "SQLite3 未安装，请先安装"
        log_info "Ubuntu/Debian: sudo apt-get install sqlite3"
        log_info "CentOS/RHEL: sudo yum install sqlite"
        log_info "macOS: brew install sqlite3"
        exit 1
    fi
    
    # 测试数据库连接
    if ! sqlite3 "./jc21/data/database.sqlite" "SELECT COUNT(*) FROM proxy_hosts;" >/dev/null 2>&1; then
        log_error "数据库连接失败"
        exit 1
    fi
    
    log_success "数据库连接测试通过"
}

# 测试配置脚本
test_configuration_scripts() {
    log_info "测试配置脚本..."
    
    # 测试 Shell 脚本
    log_info "测试 Shell 脚本..."
    if ./scripts/configure-jc21-proxy.sh --list >/dev/null 2>&1; then
        log_success "Shell 脚本测试通过"
    else
        log_error "Shell 脚本测试失败"
        return 1
    fi
    
    # 测试 Python 脚本
    log_info "测试 Python 脚本..."
    if python3 scripts/configure-jc21-proxy.py --list >/dev/null 2>&1; then
        log_success "Python 脚本测试通过"
    else
        log_warning "Python 脚本测试失败 (可能缺少 Python 环境)"
    fi
    
    # 测试 Node.js 脚本
    log_info "测试 Node.js 脚本..."
    if node scripts/configure-jc21-proxy.js --list >/dev/null 2>&1; then
        log_success "Node.js 脚本测试通过"
    else
        log_warning "Node.js 脚本测试失败 (可能缺少 Node.js 环境)"
    fi
}

# 创建测试配置
create_test_configuration() {
    log_info "创建测试配置..."
    
    # 备份当前配置
    ./scripts/configure-jc21-proxy.sh --backup
    
    # 创建本地测试配置
    ./scripts/configure-jc21-proxy.sh --create-local
    
    log_success "测试配置创建完成"
}

# 验证配置生效
verify_configuration() {
    log_info "验证配置是否生效..."
    
    # 等待配置生效
    sleep 5
    
    # 检查 Nginx 配置是否更新
    if docker compose -f docker-compose.prod-simple.yml exec nginx-proxy-manager nginx -t >/dev/null 2>&1; then
        log_success "Nginx 配置验证通过"
    else
        log_warning "Nginx 配置验证失败"
    fi
    
    # 重新加载 Nginx 配置
    docker compose -f docker-compose.prod-simple.yml exec nginx-proxy-manager nginx -s reload >/dev/null 2>&1
    log_success "Nginx 配置已重新加载"
}

# 清理测试配置
cleanup_test_configuration() {
    log_info "清理测试配置..."
    
    # 显示当前配置
    ./scripts/configure-jc21-proxy.sh --list
    
    # 询问是否清理
    read -p "是否删除测试配置？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 获取所有代理主机 ID
        local ids=$(sqlite3 "./jc21/data/database.sqlite" "SELECT id FROM proxy_hosts WHERE domain_names LIKE '%localhost%';")
        
        for id in $ids; do
            log_info "删除代理主机 ID: $id"
            ./scripts/configure-jc21-proxy.sh --delete $id
        done
        
        log_success "测试配置清理完成"
    else
        log_info "保留测试配置"
    fi
}

# 显示测试结果
show_test_results() {
    echo
    echo "=========================================="
    echo "🎉 Docker 环境下 jc21 配置脚本测试完成！"
    echo "=========================================="
    echo
    echo "✅ 测试结果:"
    echo "   - Docker 环境: 正常"
    echo "   - jc21 服务: 运行中"
    echo "   - 数据库文件: 可访问"
    echo "   - 配置脚本: 可用"
    echo
    echo "📋 可用的配置命令:"
    echo "   ./scripts/configure-jc21-proxy.sh --list"
    echo "   ./scripts/configure-jc21-proxy.sh --create"
    echo "   ./scripts/configure-jc21-proxy.sh --create-local"
    echo "   python3 scripts/configure-jc21-proxy.py --list"
    echo "   node scripts/configure-jc21-proxy.js --list"
    echo
    echo "🌐 访问地址:"
    echo "   jc21 管理界面: http://localhost:81"
    echo "   默认邮箱: admin@example.com"
    echo "   默认密码: changeme"
    echo
    echo "📚 详细文档: scripts/README-jc21-config.md"
    echo "=========================================="
}

# 主函数
main() {
    echo "🐳 Docker 环境下 jc21 配置脚本测试"
    echo "=================================="
    echo
    
    check_docker_environment
    check_jc21_service
    check_database_file
    test_database_connection
    test_configuration_scripts
    
    # 询问是否创建测试配置
    read -p "是否创建测试配置？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_test_configuration
        verify_configuration
        cleanup_test_configuration
    fi
    
    show_test_results
}

# 执行主函数
main "$@" 
