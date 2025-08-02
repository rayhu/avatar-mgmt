#!/bin/bash

# 部署模块 - 服务器部署
# ======================================

# 加载通用模块
source "$(dirname "$0")/common.sh"

# 检查服务器环境
check_server_environment() {
    log_info "检查服务器环境..."
    
    # 检查Docker
    if ! remote_exec "docker --version" >/dev/null 2>&1; then
        log_error "服务器未安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! remote_exec "docker compose version" >/dev/null 2>&1; then
        log_error "服务器未安装Docker Compose"
        exit 1
    fi
    
    # 检查目录
    if ! remote_exec "test -d $REMOTE_DIR" 2>/dev/null; then
        log_info "创建远程目录: $REMOTE_DIR"
        remote_exec "sudo mkdir -p $REMOTE_DIR && sudo chown \$USER:\$USER $REMOTE_DIR"
    fi
    
    log_success "服务器环境检查通过"
}

# 同步代码到服务器
sync_code_to_server() {
    log_info "同步代码到服务器..."
    
    # 同步主要文件
    sync_files "docker-compose.prod-simple.yml" "$REMOTE_DIR/"
    sync_files "api-server/" "$REMOTE_DIR/"
    sync_files "frontend/dist/" "$REMOTE_DIR/frontend/dist/"
    sync_files "directus/" "$REMOTE_DIR/"
    sync_files "scripts/" "$REMOTE_DIR/"
    
    # 同步环境文件（如果存在）
    if [ -f ".env.prod" ]; then
        sync_files ".env.prod" "$REMOTE_DIR/"
    fi
    
    log_success "代码同步完成"
}

# 启动服务
start_services() {
    log_info "在服务器上启动服务..."
    
    # 停止现有服务
    remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml down"
    
    # 启动服务
    remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml up -d"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    log_success "服务启动完成"
}

# 检查服务状态
check_service_status() {
    log_info "检查服务状态..."
    
    remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml ps"
    
    # 检查健康状态
    local unhealthy_count=$(remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml ps --format json" | jq -r '.[] | select(.Health == "unhealthy") | .Name' | wc -l)
    
    if [ "$unhealthy_count" -gt 0 ]; then
        log_warning "发现 $unhealthy_count 个不健康的容器"
        remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml logs --tail=20"
    else
        log_success "所有服务运行正常"
    fi
}

# 完整部署流程
full_deploy() {
    log_info "开始完整部署流程..."
    
    # 检查环境
    check_ssh_connection
    check_server_environment
    
    # 同步代码
    sync_code_to_server
    
    # 启动服务
    start_services
    
    # 检查状态
    check_service_status
    
    log_success "部署完成！"
}

# 显示部署帮助
show_deploy_help() {
    echo "
部署模块帮助

用法:
  $0 deploy [选项]

选项:
  --full             完整部署流程
  --sync             只同步代码
  --start            只启动服务
  --status           检查服务状态
  --restart          重启服务
  --stop             停止服务
  --logs             查看日志
  --help, -h         显示帮助信息

示例:
  $0 deploy --full
  $0 deploy --sync
  $0 deploy --status
"
}

# 主函数
main() {
    case "${1:-}" in
        --full)
            full_deploy
            ;;
        --sync)
            check_ssh_connection
            sync_code_to_server
            ;;
        --start)
            check_ssh_connection
            start_services
            ;;
        --status)
            check_ssh_connection
            check_service_status
            ;;
        --restart)
            check_ssh_connection
            remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml restart"
            ;;
        --stop)
            check_ssh_connection
            remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml down"
            ;;
        --logs)
            check_ssh_connection
            remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml logs --tail=50"
            ;;
        --help|-h)
            show_deploy_help
            ;;
        *)
            log_error "未知选项: $1"
            show_deploy_help
            exit 1
            ;;
    esac
}

# 如果直接执行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 
