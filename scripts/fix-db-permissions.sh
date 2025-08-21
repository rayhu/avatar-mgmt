#!/bin/bash

# 修复数据库权限脚本
# 解决 PostgreSQL 容器权限问题

set -e

echo "🔧 修复数据库权限..."

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
  echo "❌ 请使用 sudo 运行此脚本"
  exit 1
fi

# 检查 db_data 目录是否存在
if [ ! -d "db_data" ]; then
  echo "❌ db_data 目录不存在"
  exit 1
fi

echo "📁 当前 db_data 目录权限:"
ls -la db_data/ | head -5

# 修复权限
echo "🔧 修复目录权限..."
chown -R 999:999 db_data/
chmod -R 700 db_data/

echo "✅ 权限修复完成！"
echo "📁 修复后的权限:"
ls -la db_data/ | head -5

echo ""
echo "💡 提示："
echo "   - 现在可以重新启动数据库服务"
echo "   - 如果问题仍然存在，可能需要重新初始化数据库"
echo "   - 建议在 docker-compose.db.yml 中添加 user: '999:999'"
