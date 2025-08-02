#!/bin/bash

# 配置模块 - JC21配置
# ======================================

# 加载通用模块
source "$(dirname "$0")/common.sh"

# 配置JC21
configure_jc21() {
    log_info "配置JC21 Nginx Proxy Manager..."
    
    # 检查JC21是否运行
    if ! remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml ps | grep nginx-proxy-manager" >/dev/null 2>&1; then
        log_error "JC21容器未运行"
        exit 1
    fi
    
    # 运行配置脚本
    log_info "运行JC21配置脚本..."
    remote_exec "cd $REMOTE_DIR && sudo ./scripts/configure-production.sh --create"
    
    log_success "JC21配置完成"
}

# 检查JC21配置
check_jc21_config() {
    log_info "检查JC21配置..."
    
    # 检查代理主机
    remote_exec "cd $REMOTE_DIR && sudo ./scripts/configure-production.sh --list"
    
    # 检查nginx配置
    remote_exec "sudo docker exec avatar-mgmt-nginx-proxy-manager-1 nginx -t"
    
    log_success "JC21配置检查完成"
}

# 重置JC21配置
reset_jc21_config() {
    log_info "重置JC21配置..."
    
    remote_exec "cd $REMOTE_DIR && sudo ./scripts/configure-production.sh --delete"
    remote_exec "cd $REMOTE_DIR && sudo ./scripts/configure-production.sh --create"
    
    log_success "JC21配置已重置"
}

# 测试JC21连接
test_jc21_connections() {
    log_info "测试JC21连接..."
    
    # 测试前端
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN")
    log_info "前端状态: $frontend_status"
    
    # 测试API
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/api/health")
    log_info "API状态: $api_status"
    
    # 测试JC21管理界面
    local admin_status=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN:81")
    log_info "管理界面状态: $admin_status"
    
    if [ "$frontend_status" = "200" ] && [ "$admin_status" = "200" ]; then
        log_success "JC21连接测试通过"
    else
        log_warning "JC21连接测试发现问题"
    fi
}

# 显示配置帮助
show_config_help() {
    echo "
配置模块帮助

用法:
  $0 config [选项]

选项:
  --configure        配置JC21
  --check            检查JC21配置
  --reset            重置JC21配置
  --test             测试JC21连接
  --help, -h         显示帮助信息

示例:
  $0 config --configure
  $0 config --check
  $0 config --test
"
}

# 主函数
main() {
    case "${1:-}" in
        --configure)
            check_ssh_connection
            configure_jc21
            ;;
        --check)
            check_ssh_connection
            check_jc21_config
            ;;
        --reset)
            check_ssh_connection
            reset_jc21_config
            ;;
        --test)
            test_jc21_connections
            ;;
        --help|-h)
            show_config_help
            ;;
        *)
            log_error "未知选项: $1"
            show_config_help
            exit 1
            ;;
    esac
}

# 如果直接执行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 
