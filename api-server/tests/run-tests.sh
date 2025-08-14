#!/bin/bash

# 测试运行脚本
# 支持不同的测试模式和选项

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示此帮助信息"
    echo "  -w, --watch             监视模式运行测试"
    echo "  -c, --coverage          生成覆盖率报告"
    echo "  -u, --unit              只运行单元测试"
    echo "  -i, --integration       只运行集成测试"
    echo "  -a, --all               运行所有测试"
    echo "  -v, --verbose           详细输出"
    echo "  --ci                    持续集成模式"
    echo ""
    echo "示例:"
    echo "  $0 --coverage            # 运行测试并生成覆盖率报告"
    echo "  $0 --watch               # 监视模式运行测试"
    echo "  $0 --unit                # 只运行单元测试"
    echo "  $0 --ci                  # CI 模式运行测试"
}

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}🔍 检查依赖...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    if ! command -v yarn &> /dev/null; then
        echo -e "${RED}❌ yarn 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖检查通过${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装依赖...${NC}"
    
    if [ ! -d "node_modules" ]; then
        yarn install
    else
        yarn install --silent
    fi
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 运行单元测试
run_unit_tests() {
    echo -e "${BLUE}🧪 运行单元测试...${NC}"
    
    if [ "$VERBOSE" = true ]; then
        yarn test -- --testPathPattern="tests/utils|tests/handlers" --verbose
    else
        yarn test -- --testPathPattern="tests/utils|tests/handlers"
    fi
}

# 运行集成测试
run_integration_tests() {
    echo -e "${BLUE}🔗 运行集成测试...${NC}"
    
    if [ "$VERBOSE" = true ]; then
        yarn test -- --testPathPattern="tests/integration" --verbose
    else
        yarn test -- --testPathPattern="tests/integration"
    fi
}

# 运行所有测试
run_all_tests() {
    echo -e "${BLUE}🚀 运行所有测试...${NC}"
    
    if [ "$VERBOSE" = true ]; then
        yarn test -- --verbose
    else
        yarn test
    fi
}

# 生成覆盖率报告
run_coverage_tests() {
    echo -e "${BLUE}📊 生成覆盖率报告...${NC}"
    
    if [ "$VERBOSE" = true ]; then
        yarn test:coverage -- --verbose
    else
        yarn test:coverage
    fi
    
    echo -e "${GREEN}✅ 覆盖率报告已生成在 coverage/ 目录中${NC}"
    echo -e "${BLUE}📁 打开 coverage/lcov-report/index.html 查看详细报告${NC}"
}

# 监视模式运行测试
run_watch_tests() {
    echo -e "${BLUE}👀 监视模式运行测试...${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止监视${NC}"
    
    yarn test:watch
}

# CI 模式运行测试
run_ci_tests() {
    echo -e "${BLUE}🔄 CI 模式运行测试...${NC}"
    
    yarn test:ci
    
    echo -e "${GREEN}✅ CI 测试完成${NC}"
}

# 显示测试结果摘要
show_summary() {
    echo ""
    echo -e "${BLUE}📋 测试结果摘要${NC}"
    echo "=================="
    
    if [ -f "coverage/coverage-summary.json" ]; then
        echo -e "${GREEN}✅ 覆盖率报告已生成${NC}"
        echo "查看 coverage/lcov-report/index.html"
    fi
    
    echo -e "${GREEN}🎉 测试完成！${NC}"
}

# 主函数
main() {
    # 默认值
    WATCH=false
    COVERAGE=false
    UNIT_ONLY=false
    INTEGRATION_ONLY=false
    ALL_TESTS=false
    VERBOSE=false
    CI_MODE=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -w|--watch)
                WATCH=true
                shift
                ;;
            -c|--coverage)
                COVERAGE=true
                shift
                ;;
            -u|--unit)
                UNIT_ONLY=true
                shift
                ;;
            -i|--integration)
                INTEGRATION_ONLY=true
                shift
                ;;
            -a|--all)
                ALL_TESTS=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --ci)
                CI_MODE=true
                shift
                ;;
            *)
                echo -e "${RED}❌ 未知选项: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 如果没有指定任何选项，默认运行所有测试
    if [ "$WATCH" = false ] && [ "$COVERAGE" = false ] && [ "$UNIT_ONLY" = false ] && [ "$INTEGRATION_ONLY" = false ] && [ "$ALL_TESTS" = false ] && [ "$CI_MODE" = false ]; then
        ALL_TESTS=true
    fi
    
    echo -e "${BLUE}🚀 开始测试流程...${NC}"
    echo ""
    
    # 检查依赖和安装
    check_dependencies
    install_dependencies
    
    echo ""
    
    # 根据选项执行相应的测试
    if [ "$CI_MODE" = true ]; then
        run_ci_tests
    elif [ "$WATCH" = true ]; then
        run_watch_tests
    elif [ "$COVERAGE" = true ]; then
        run_coverage_tests
    elif [ "$UNIT_ONLY" = true ]; then
        run_unit_tests
    elif [ "$INTEGRATION_ONLY" = true ]; then
        run_integration_tests
    elif [ "$ALL_TESTS" = true ]; then
        run_all_tests
    fi
    
    # 显示摘要
    if [ "$WATCH" = false ]; then
        show_summary
    fi
}

# 执行主函数
main "$@"
