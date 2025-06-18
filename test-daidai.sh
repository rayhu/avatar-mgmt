#!/bin/bash

# 测试脚本 - 验证 daidai.amis.hk 部署状态
# ==========================================

DOMAIN="daidai.amis.hk"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试函数
test_https() {
    echo -e "${BLUE}测试 HTTPS 连接...${NC}"
    if curl -s -I "https://$DOMAIN" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        echo -e "${GREEN}✅ HTTPS 连接正常${NC}"
        return 0
    else
        echo -e "${RED}❌ HTTPS 连接失败${NC}"
        return 1
    fi
}

test_api() {
    echo -e "${BLUE}测试 API 端点...${NC}"
    if curl -s "https://$DOMAIN/api/avatars" | grep -q "\[\]"; then
        echo -e "${GREEN}✅ API 端点正常${NC}"
        return 0
    else
        echo -e "${RED}❌ API 端点失败${NC}"
        return 1
    fi
}

test_directus() {
    echo -e "${BLUE}测试 Directus 管理后台...${NC}"
    if curl -s -I "https://$DOMAIN/directus/" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        echo -e "${GREEN}✅ Directus 可访问${NC}"
        return 0
    else
        echo -e "${RED}❌ Directus 访问失败${NC}"
        return 1
    fi
}

test_ssl() {
    echo -e "${BLUE}测试 SSL 证书...${NC}"
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✅ SSL 证书有效${NC}"
        return 0
    else
        echo -e "${RED}❌ SSL 证书无效${NC}"
        return 1
    fi
}

test_services() {
    echo -e "${BLUE}检查 Docker 服务状态...${NC}"
    if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        echo -e "${GREEN}✅ 所有服务运行正常${NC}"
        docker compose -f docker-compose.prod.yml ps
        return 0
    else
        echo -e "${RED}❌ 服务状态异常${NC}"
        docker compose -f docker-compose.prod.yml ps
        return 1
    fi
}

# 主测试函数
main() {
    echo "🔍 开始测试 $DOMAIN 部署状态"
    echo "================================"
    
    local total_tests=5
    local passed_tests=0
    
    # 测试 HTTPS
    if test_https; then
        ((passed_tests++))
    fi
    
    # 测试 API
    if test_api; then
        ((passed_tests++))
    fi
    
    # 测试 Directus
    if test_directus; then
        ((passed_tests++))
    fi
    
    # 测试 SSL
    if test_ssl; then
        ((passed_tests++))
    fi
    
    # 测试服务状态
    if test_services; then
        ((passed_tests++))
    fi
    
    echo
    echo "================================"
    echo "📊 测试结果: $passed_tests/$total_tests 通过"
    
    if [ $passed_tests -eq $total_tests ]; then
        echo -e "${GREEN}🎉 所有测试通过！部署成功！${NC}"
        echo
        echo "🌐 访问地址："
        echo "   前端应用: https://$DOMAIN"
        echo "   API 接口: https://$DOMAIN/api/avatars"
        echo "   管理后台: https://$DOMAIN/directus/"
        echo
        echo "🔐 登录信息："
        echo "   前端: admin / admin123"
        echo "   Directus: admin@example.com / admin1234"
    else
        echo -e "${RED}⚠️  部分测试失败，请检查部署状态${NC}"
        echo
        echo "📋 故障排除建议："
        echo "1. 检查服务日志: docker compose -f docker-compose.prod.yml logs"
        echo "2. 检查 SSL 证书: docker compose -f docker-compose.prod.yml exec certbot certbot certificates"
        echo "3. 重启服务: docker compose -f docker-compose.prod.yml restart"
    fi
}

# 执行测试
main "$@" 
