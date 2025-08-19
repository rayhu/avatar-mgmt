#!/bin/bash

# 统一检查脚本 - 可在本地和 CI 中运行
# 使用方法: ./run-checks.sh [--local] [--skip-format] [--skip-audit]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认参数
LOCAL_MODE=false
SKIP_FORMAT=false
SKIP_AUDIT=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --local)
      LOCAL_MODE=true
      shift
      ;;
    --skip-format)
      SKIP_FORMAT=true
      shift
      ;;
    --skip-audit)
      SKIP_AUDIT=true
      shift
      ;;
    --help)
      echo "使用方法: $0 [选项]"
      echo "选项:"
      echo "  --local        本地模式（不设置 CI 环境变量）"
      echo "  --skip-format  跳过代码格式化检查"
      echo "  --skip-audit   跳过安全审计"
      echo "  --help         显示此帮助信息"
      exit 0
      ;;
    *)
      echo "未知选项: $1"
      echo "使用 --help 查看帮助"
      exit 1
      ;;
  esac
done

# 日志函数
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# 检查命令是否存在
check_command() {
  if ! command -v "$1" &> /dev/null; then
    log_error "命令 '$1' 未找到"
    exit 1
  fi
}

# 检查依赖锁定文件
check_lockfile() {
  log_info "检查依赖锁定文件..."
  
  cd frontend
  if ! yarn install --frozen-lockfile --prefer-offline; then
    log_error "前端依赖锁定文件过期，请运行 'yarn install' 更新"
    exit 1
  fi
  cd ..
  
  cd api-server
  if ! yarn install --frozen-lockfile --prefer-offline; then
    log_error "API 服务器依赖锁定文件过期，请运行 'yarn install' 更新"
    exit 1
  fi
  cd ..
  
  log_success "依赖锁定文件检查通过"
}

# 设置环境
setup_environment() {
  if [ "$LOCAL_MODE" = true ]; then
    log_info "本地模式：使用系统环境"
    # 检查必要的命令
    check_command "node"
    check_command "yarn"
  else
    log_info "CI 模式：设置 Volta 环境"
    export VOLTA_HOME="$HOME/.volta"
    export PATH="$VOLTA_HOME/bin:$PATH"
    
    # 检查 Volta 是否可用
    if ! command -v volta &> /dev/null; then
      log_error "Volta 未安装或未在 PATH 中"
      exit 1
    fi
  fi
  
  # 显示版本信息
  log_info "Node.js 版本: $(node --version)"
  log_info "Yarn 版本: $(yarn --version)"
}

# 安装依赖
install_dependencies() {
  log_info "安装前端依赖..."
  cd frontend
  yarn install --frozen-lockfile
  cd ..
  
  log_info "安装 API 服务器依赖..."
  cd api-server
  yarn install --frozen-lockfile
  cd ..
  
  # 验证依赖安装后立即测试构建
  log_info "验证依赖安装..."
  cd frontend
  log_info "🔍 验证前端构建..."
  # 使用 type-check 来验证依赖，避免实际构建
  yarn type-check
  cd ..
  
  log_success "依赖安装和验证完成"
}

# 运行前端检查
run_frontend_checks() {
  log_info "运行前端检查..."
  cd frontend
  
  log_info "🔍 运行 ESLint..."
  yarn lint
  
  log_info "🔍 运行 TypeScript 类型检查..."
  yarn type-check
  
  log_info "🌐 运行 i18n 检查..."
  yarn i18n:check
  
  log_info "🧪 运行测试..."
  yarn test:run
  
  log_info "🏗️ 运行构建检查..."
  yarn build
  
  cd ..
  log_success "前端检查完成"
}

# 运行代码格式化检查
run_format_checks() {
  if [ "$SKIP_FORMAT" = true ]; then
    log_warning "跳过代码格式化检查"
    return 0
  fi
  
  log_info "检查代码格式化..."
  
  log_info "🔍 检查代码格式..."
  if yarn format:check; then
    log_success "代码格式检查通过"
  else
    if [ "$LOCAL_MODE" = true ]; then
      # 本地模式：提供修复选项
      log_error "代码格式检查失败！"
      log_warning "建议使用 Git hooks 自动修复："
      log_warning "  git add ."
      log_warning "  git commit -m 'your message'  # 会自动触发 lint-staged"
      log_warning ""
      log_warning "或者手动修复："
      log_warning "  yarn format"
      log_warning "  git add ."
      log_warning "  git commit -m 'style: fix formatting'"
      log_warning ""
      log_warning "是否要现在自动修复？(y/N)"
      read -r response
      if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "自动修复格式问题..."
        yarn format
        log_success "格式问题已修复，请重新提交"
      else
        log_error "请使用 Git hooks 或手动修复格式问题"
        exit 1
      fi
    else
      # CI 模式：只验证，不修复
      log_error "代码格式检查失败！"
      log_error "这表明 Git hooks 没有正确工作。"
      log_error "请检查："
      log_error "  1. 是否安装了 husky: yarn prepare"
      log_error "  2. 是否配置了 lint-staged"
      log_error "  3. 是否在正确的分支上"
      log_error ""
      log_error "或者手动修复格式问题后重新提交"
      exit 1
    fi
  fi
}

# 运行 API 服务器检查
run_api_checks() {
  log_info "运行 API 服务器检查..."
  cd api-server
  
  log_info "🔍 运行 API TypeScript 检查..."
  if yarn type-check; then
    log_success "TypeScript 类型检查通过"
  else
    log_error "TypeScript 类型检查失败"
    exit 1
  fi
  
  log_info "🧪 运行 API 测试..."
  yarn test
  
  cd ..
  log_success "API 服务器检查完成"
}

# 运行安全审计
run_security_audit() {
  if [ "$SKIP_AUDIT" = true ]; then
    log_warning "跳过安全审计"
    return 0
  fi
  
  log_info "检查安全漏洞..."
  
  log_info "检查前端依赖漏洞..."
  cd frontend
  yarn audit --audit-level moderate
  cd ..
  
  log_info "检查 API 服务器依赖漏洞..."
  cd api-server
  yarn audit --audit-level moderate
  cd ..
  
  log_success "安全审计完成"
}

# 生成 i18n 报告
generate_i18n_report() {
  log_info "生成 i18n 报告..."
  cd frontend
  
  if yarn i18n:report; then
    log_success "i18n 报告生成成功"
  else
    log_warning "i18n 报告生成失败，但继续执行"
  fi
  
  cd ..
}

# 主函数
main() {
  log_info "开始运行统一检查..."
  log_info "模式: $([ "$LOCAL_MODE" = true ] && echo "本地" || echo "CI")"
  log_info "跳过格式化: $([ "$SKIP_FORMAT" = true ] && echo "是" || echo "否")"
  log_info "跳过审计: $([ "$SKIP_AUDIT" = true ] && echo "是" || echo "否")"
  echo ""
  
  # 检查是否在正确的目录
  if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "api-server" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
  fi
  
  # 执行检查
  setup_environment
  check_lockfile
  install_dependencies
  run_frontend_checks
  run_format_checks
  run_api_checks
  run_security_audit
  generate_i18n_report
  
  log_success "所有检查完成！"
  log_info "如果看到警告，请检查并修复相关问题"
}

# 运行主函数
main "$@"
