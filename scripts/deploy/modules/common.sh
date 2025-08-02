#!/bin/bash

# 通用模块 - 基础功能和配置
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

# 错误处理
handle_error() {
    local exit_code=$?
    log_error "命令执行失败，退出码: $exit_code"
    log_error "请检查日志并重试"
    exit $exit_code
}

# 设置错误处理
trap handle_error ERR

# 配置变量
export SERVER_HOST="${SERVER_HOST:-daidai-singapore}"
export REMOTE_DIR="${REMOTE_DIR:-/opt/avatar-mgmt}"
export DOMAIN="${DOMAIN:-daidai.amis.hk}"
export PROJECT_NAME="avatar-mgmt"

# 检查必需的工具
check_requirements() {
    local tools=("ssh" "rsync" "docker" "docker-compose")
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "必需的工具未安装: $tool"
            exit 1
        fi
    done
    
    log_success "所有必需工具已安装"
}

# 检查SSH连接
check_ssh_connection() {
    log_info "检查SSH连接..."
    if ! ssh -o ConnectTimeout=10 "$SERVER_HOST" "echo 'SSH连接正常'" >/dev/null 2>&1; then
        log_error "无法连接到服务器: $SERVER_HOST"
        exit 1
    fi
    log_success "SSH连接正常"
}

# 执行远程命令
remote_exec() {
    local cmd="$1"
    log_info "执行远程命令: $cmd"
    ssh "$SERVER_HOST" "$cmd"
}

# 同步文件到服务器
sync_files() {
    local source="$1"
    local dest="$2"
    log_info "同步文件: $source -> $SERVER_HOST:$dest"
    rsync -avz --delete "$source" "$SERVER_HOST:$dest"
}

# 显示帮助信息
show_help() {
    echo "
部署系统帮助

用法:
  $0 [模块] [选项]

模块:
  build       构建前端
  deploy      部署到服务器
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

示例:
  $0 build
  $0 deploy
  $0 test
"
} 
