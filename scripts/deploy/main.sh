#!/bin/bash

# 主部署脚本 - 整合所有模块
# ======================================

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULES_DIR="$SCRIPT_DIR/modules"

# 加载通用模块
source "$MODULES_DIR/common.sh"

# 显示主帮助信息
show_main_help() {
    echo "
Avatar Management 部署系统
========================

用法:
  $0 [模块] [选项]

模块:
  build       构建前端和API镜像
  deploy      部署到服务器
  config      配置JC21
  test        测试部署
  logs        查看日志
  status      查看状态
  backup      备份数据
  restore     恢复数据

选项:
  --help, -h   显示帮助信息
  --verbose, -v 详细输出

环境变量:
  SERVER_HOST    服务器地址 (默认: daidai-singapore)
  REMOTE_DIR     远程目录 (默认: /opt/avatar-mgmt)
  DOMAIN         域名 (默认: daidai.amis.hk)

快速命令:
  $0 build --all              # 构建所有组件
  $0 deploy --full            # 完整部署
  $0 config --configure       # 配置JC21
  $0 test                     # 测试部署

示例:
  $0 build --frontend
  $0 deploy --sync
  $0 config --test
"
}

# 测试部署
test_deployment() {
    log_info "测试部署..."
    
    # 检查SSH连接
    check_ssh_connection
    
    # 检查服务状态
    source "$MODULES_DIR/deploy.sh"
    check_service_status
    
    # 测试JC21连接
    source "$MODULES_DIR/config.sh"
    test_jc21_connections
    
    log_success "部署测试完成"
}

# 查看日志
show_logs() {
    log_info "查看服务日志..."
    
    check_ssh_connection
    remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml logs --tail=100"
}

# 查看状态
show_status() {
    log_info "查看服务状态..."
    
    check_ssh_connection
    remote_exec "cd $REMOTE_DIR && sudo docker compose -f docker-compose.prod-simple.yml ps"
    remote_exec "sudo docker stats --no-stream"
}

# 备份数据
backup_data() {
    log_info "备份数据..."
    
    check_ssh_connection
    
    local backup_dir="./backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份JC21数据
    remote_exec "cd $REMOTE_DIR && sudo tar -czf jc21-backup.tar.gz jc21/"
    rsync -avz "$SERVER_HOST:$REMOTE_DIR/jc21-backup.tar.gz" "$backup_dir/"
    
    # 备份Directus数据
    remote_exec "cd $REMOTE_DIR && sudo tar -czf directus-backup.tar.gz directus/"
    rsync -avz "$SERVER_HOST:$REMOTE_DIR/directus-backup.tar.gz" "$backup_dir/"
    
    log_success "数据备份完成: $backup_dir"
}

# 恢复数据
restore_data() {
    local backup_dir="$1"
    
    if [ -z "$backup_dir" ]; then
        log_error "请指定备份目录"
        exit 1
    fi
    
    log_info "恢复数据: $backup_dir"
    
    check_ssh_connection
    
    # 恢复JC21数据
    if [ -f "$backup_dir/jc21-backup.tar.gz" ]; then
        rsync -avz "$backup_dir/jc21-backup.tar.gz" "$SERVER_HOST:$REMOTE_DIR/"
        remote_exec "cd $REMOTE_DIR && sudo tar -xzf jc21-backup.tar.gz"
    fi
    
    # 恢复Directus数据
    if [ -f "$backup_dir/directus-backup.tar.gz" ]; then
        rsync -avz "$backup_dir/directus-backup.tar.gz" "$SERVER_HOST:$REMOTE_DIR/"
        remote_exec "cd $REMOTE_DIR && sudo tar -xzf directus-backup.tar.gz"
    fi
    
    log_success "数据恢复完成"
}

# 主函数
main() {
    local module="${1:-}"
    local action="${2:-}"
    
    case "$module" in
        build)
            source "$MODULES_DIR/build.sh"
            main "$@"
            ;;
        deploy)
            source "$MODULES_DIR/deploy.sh"
            main "$@"
            ;;
        config)
            source "$MODULES_DIR/config.sh"
            main "$@"
            ;;
        test)
            test_deployment
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data "$action"
            ;;
        --help|-h|"")
            show_main_help
            ;;
        *)
            log_error "未知模块: $module"
            show_main_help
            exit 1
            ;;
    esac
}

# 如果直接执行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # 检查必需工具
    check_requirements
    
    # 执行主函数
    main "$@"
fi 
