#!/bin/bash

# 数字人管理系统部署脚本 - daidai.amis.hk
# ==========================================

set -e  # 遇到错误立即退出

# 配置变量
DOMAIN="daidai.amis.hk"
EMAIL="ray@amis.hk"  # 请根据实际情况修改邮箱
PROJECT_DIR="$(pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查函数
check_prerequisites() {
    log_info "检查部署前置条件..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    # 检查域名解析
    log_info "检查域名解析..."
    if ! nslookup $DOMAIN &> /dev/null; then
        log_warning "无法解析域名 $DOMAIN，请确保 DNS 配置正确"
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 检查端口占用
    log_info "检查端口占用..."
    if netstat -tulpn 2>/dev/null | grep -q ":80 "; then
        log_warning "端口 80 已被占用"
    fi
    if netstat -tulpn 2>/dev/null | grep -q ":443 "; then
        log_warning "端口 443 已被占用"
    fi
    
    log_success "前置条件检查完成"
}

# 环境配置
setup_environment() {
    log_info "配置环境变量..."
    
    # 检查 .env.prod 文件
    if [ ! -f ".env.prod" ]; then
        log_error ".env.prod 文件不存在，请先创建环境配置文件"
        exit 1
    fi
    
    # 创建必要的目录
    mkdir -p certbot/conf certbot/www
    mkdir -p directus/uploads directus/extensions directus/schemas
    
    log_success "环境配置完成"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    # 清理旧镜像
    log_info "清理旧镜像..."
    docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    # 构建新镜像
    log_info "构建生产环境镜像..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    log_success "镜像构建完成"
}

# 获取 SSL 证书
setup_ssl() {
    log_info "配置 SSL 证书..."
    
    # 停止 nginx 容器（如果存在）
    docker compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true
    
    # 使用初始化配置启动 nginx
    log_info "启动临时 nginx 服务..."
    docker run -d --name nginx-temp \
        -p 80:80 \
        -v "$(pwd)/nginx/nginx-init.conf:/etc/nginx/nginx.conf:ro" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        nginx:alpine
    
    # 等待 nginx 启动
    sleep 5
    
    # 获取 SSL 证书
    log_info "申请 Let's Encrypt SSL 证书..."
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d "$DOMAIN"
    
    # 停止临时 nginx
    docker stop nginx-temp
    docker rm nginx-temp
    
    # 检查证书是否获取成功
    if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
        log_success "SSL 证书获取成功！"
        
        # 更新 nginx 配置中的域名
        log_info "更新 nginx 配置..."
        sed -i.bak "s/your-domain.com/$DOMAIN/g" nginx/nginx.conf
        
    else
        log_error "SSL 证书获取失败"
        log_error "请检查："
        log_error "1. 域名 DNS 是否正确解析到服务器"
        log_error "2. 端口 80 是否可以从互联网访问"
        log_error "3. 域名拼写是否正确"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动生产服务..."
    
    # 启动所有服务
    docker compose -f docker-compose.prod.yml up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    log_info "检查服务状态..."
    docker compose -f docker-compose.prod.yml ps
    
    log_success "服务启动完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 等待服务完全启动
    sleep 15
    
    # 测试 HTTPS 连接
    log_info "测试 HTTPS 连接..."
    if curl -s -I "https://$DOMAIN" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        log_success "HTTPS 连接正常"
    else
        log_warning "HTTPS 连接测试失败，请手动检查"
    fi
    
    # 测试 API 端点
    log_info "测试 API 端点..."
    if curl -s "https://$DOMAIN/api/avatars" | grep -q "\[\]"; then
        log_success "API 端点正常"
    else
        log_warning "API 端点测试失败，请手动检查"
    fi
    
    log_success "部署验证完成"
}

# 显示访问信息
show_access_info() {
    echo
    echo "=========================================="
    echo "🎉 部署完成！"
    echo "=========================================="
    echo
    echo "🌐 访问地址："
    echo "   前端应用: https://$DOMAIN"
    echo "   API 接口: https://$DOMAIN/api/avatars"
    echo "   管理后台: https://$DOMAIN/directus/"
    echo
    echo "🔐 登录信息："
    echo "   前端登录: admin / admin123"
    echo "   Directus: admin@example.com / admin1234"
    echo
    echo "📋 管理命令："
    echo "   查看服务状态: docker compose -f docker-compose.prod.yml ps"
    echo "   查看日志: docker compose -f docker-compose.prod.yml logs -f"
    echo "   重启服务: docker compose -f docker-compose.prod.yml restart"
    echo "   停止服务: docker compose -f docker-compose.prod.yml down"
    echo
    echo "🔒 SSL 证书管理："
    echo "   查看证书: docker compose -f docker-compose.prod.yml exec certbot certbot certificates"
    echo "   手动续期: docker compose -f docker-compose.prod.yml exec certbot certbot renew"
    echo
    echo "📚 文档："
    echo "   SSL 配置: docs/ssl-setup.md"
    echo "   部署指南: docs/deployment.md"
    echo
    echo "=========================================="
}

# 主函数
main() {
    echo "🚀 开始部署数字人管理系统到 $DOMAIN"
    echo
    
    check_prerequisites
    setup_environment
    build_images
    setup_ssl
    start_services
    verify_deployment
    show_access_info
}

# 执行主函数
main "$@" 
