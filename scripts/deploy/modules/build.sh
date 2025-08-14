#!/bin/bash

# 构建模块 - 前端构建
# ======================================

# 加载通用模块
source "$(dirname "$0")/common.sh"

# 构建前端
build_frontend() {
    log_info "开始构建前端..."
    
    # 检查前端目录
    if [ ! -d "frontend" ]; then
        log_error "前端目录不存在"
        exit 1
    fi
    
    # 进入前端目录
    cd frontend
    
    # 安装依赖
    log_info "安装前端依赖..."
    if ! yarn install; then
        log_error "前端依赖安装失败"
        exit 1
    fi
    
    # 构建生产版本
    log_info "构建前端生产版本..."
    if ! yarn build; then
        log_error "前端构建失败"
        exit 1
    fi
    
    # 检查构建结果
    if [ ! -d "dist" ]; then
        log_error "构建输出目录不存在"
        exit 1
    fi
    
    log_success "前端构建完成"
    cd ..
    
    # 生成版本信息
    log_info "生成版本信息..."
    if [ -f "scripts/deploy/version.sh" ]; then
        chmod +x scripts/deploy/version.sh
        ./scripts/deploy/version.sh deploy
    else
        log_warning "版本管理脚本不存在，跳过版本信息生成"
    fi
}

# 构建API镜像
build_api_image() {
    log_info "构建API Docker镜像..."
    
    # 检查API目录
    if [ ! -d "api-server" ]; then
        log_error "API目录不存在"
        exit 1
    fi
    
    # 构建镜像
    if ! docker build -t avatar-mgmt-api:latest -f api-server/Dockerfile .; then
        log_error "API镜像构建失败"
        exit 1
    fi
    
    log_success "API镜像构建完成"
}

# 显示构建帮助
show_build_help() {
    echo "
构建模块帮助

用法:
  $0 build [选项]

选项:
  --frontend, -f    只构建前端
  --api, -a         只构建API镜像
  --all             构建所有组件
  --help, -h        显示帮助信息

示例:
  $0 build --frontend
  $0 build --api
  $0 build --all
"
}

# 主函数
main() {
    case "${1:-}" in
        --frontend|-f)
            build_frontend
            ;;
        --api|-a)
            build_api_image
            ;;
        --all)
            build_frontend
            build_api_image
            ;;
        --help|-h)
            show_build_help
            ;;
        *)
            log_error "未知选项: $1"
            show_build_help
            exit 1
            ;;
    esac
}

# 如果直接执行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 
