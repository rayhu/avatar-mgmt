#!/bin/bash

# Stage 环境部署脚本
# 用法: ./scripts/deploy-stage.sh

set -e

echo "🚀 开始 Stage 环境部署..."

# 检查是否在正确的目录
if [ ! -f "frontend/package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 构建 Stage 环境的前端
echo "📦 构建 Stage 环境前端..."
cd frontend
yarn build:stage
cd ..

# 检查构建是否成功
if [ ! -d "frontend/dist" ]; then
    echo "❌ 错误：前端构建失败"
    exit 1
fi

echo "✅ 前端构建完成"

# 启动 Stage 环境
echo "🐳 启动 Stage 环境..."
docker compose -f docker-compose.stage.yml up -d

echo "✅ Stage 环境部署完成！"
echo "🌐 访问地址: http://localhost:5173"
echo "🔧 环境测试: http://localhost:5173/env-test" 
