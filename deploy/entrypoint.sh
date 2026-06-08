#!/bin/sh
set -e

echo "============================================"
echo "  院感培训考试系统 - 启动中"
echo "============================================"

# 执行数据库迁移（如果需要）
cd /app/backend
echo "[1/3] 执行数据库迁移..."
npx prisma migrate deploy 2>/dev/null || echo "  数据库迁移跳过（可能已最新）"

# 确保 uploads 目录存在
mkdir -p /app/backend/uploads

echo "[2/3] 启动后端服务 (端口 3000)..."
echo "[3/3] 启动 Nginx (端口 80)..."

echo "============================================"
echo "  管理端: http://your-server-ip/admin/"
echo "  用户端: http://your-server-ip/user/"
echo "============================================"

# 启动 supervisor 管理 nginx + node
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
