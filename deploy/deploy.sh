#!/bin/bash
# ============================================================
# 宝塔面板 Docker 部署脚本
# ============================================================

set -e

echo "============================================"
echo "  院感培训考试系统 - Docker 部署"
echo "============================================"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "[!] 未找到 .env 文件，从模板创建..."
    cp .env.production .env
    echo "[!] 请编辑 .env 文件，修改数据库密码、JWT密钥等配置后重新运行此脚本"
    echo ""
    echo "    必须修改的配置项："
    echo "    - DATABASE_URL: MySQL 连接地址"
    echo "    - JWT_SECRET: JWT 密钥（建议用 openssl rand -hex 32 生成）"
    echo "    - CORS_ORIGIN: 前端访问地址"
    echo ""
    exit 1
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[x] Docker 未安装，请先在宝塔面板中安装 Docker 管理器"
    exit 1
fi

# 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo "[x] Docker Compose 不可用，请检查 Docker 版本"
    exit 1
fi

echo "[1/3] 构建镜像（首次较慢，约5-10分钟）..."
docker compose build --no-cache

echo "[2/3] 启动容器..."
docker compose up -d

echo "[3/3] 等待服务就绪..."
sleep 10

# 检查容器状态
if docker compose ps | grep -q "healthy\|running"; then
    echo ""
    echo "============================================"
    echo "  部署成功！"
    echo "============================================"
    echo ""
    echo "  管理端: http://YOUR_SERVER_IP:3080/admin/"
    echo "  用户端: http://YOUR_SERVER_IP:3080/user/"
    echo ""
    echo "  默认管理员账号: admin / 123456"
    echo ""
    echo "  常用命令："
    echo "  - 查看日志: docker compose logs -f"
    echo "  - 重启服务: docker compose restart"
    echo "  - 停止服务: docker compose down"
    echo "  - 更新部署: docker compose up -d --build"
    echo "============================================"
else
    echo "[x] 容器启动异常，请查看日志: docker compose logs"
    exit 1
fi
