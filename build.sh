#!/bin/bash
# ============================================================
# 本地构建脚本 - 在本地机器上编译所有项目
# 编译完成后将整个目录上传到服务器，再执行 docker compose up
# ============================================================

set -e

echo "============================================"
echo "  院感培训考试系统 - 本地构建"
echo "============================================"

# ---------- 1. 构建后端 ----------
echo ""
echo "[1/3] 构建后端..."
cd backend
npm install
npx prisma generate
npm run build
cd ..

# ---------- 2. 构建管理端前端 ----------
echo ""
echo "[2/3] 构建管理端前端..."
cd frontend-admin-pc
# 确保 .env 中 VITE_API_BASE_URL=/api
export VITE_API_BASE_URL=/api
npm install
npm run build
cd ..

# ---------- 3. 构建用户端前端 ----------
echo ""
echo "[3/3] 构建用户端前端..."
cd frontend-user
export VITE_API_BASE_URL=/api
npm install
npm run build
cd ..

echo ""
echo "============================================"
echo "  构建完成！"
echo ""
echo "  下一步："
echo "  1. 将整个 project 目录上传到服务器"
echo "  2. 在服务器上执行："
echo "     cd /path/to/project"
echo "     cp .env.production .env   # 修改数据库等配置"
echo "     docker compose up -d"
echo "============================================"
