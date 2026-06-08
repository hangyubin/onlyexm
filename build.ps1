# 本地构建脚本 (Windows PowerShell)
# 在本地机器上编译所有项目，编译完成后上传到服务器

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  院感培训考试系统 - 本地构建" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ---------- 1. 构建后端 ----------
Write-Host ""
Write-Host "[1/3] 构建后端..." -ForegroundColor Yellow
Set-Location backend
npm install
npx prisma generate
npm run build
Set-Location ..

# ---------- 2. 构建管理端前端 ----------
Write-Host ""
Write-Host "[2/3] 构建管理端前端..." -ForegroundColor Yellow
Set-Location frontend-admin-pc
$env:VITE_API_BASE_URL = "/api"
npm install
npm run build
Set-Location ..

# ---------- 3. 构建用户端前端 ----------
Write-Host ""
Write-Host "[3/3] 构建用户端前端..." -ForegroundColor Yellow
Set-Location frontend-user
$env:VITE_API_BASE_URL = "/api"
npm install
npm run build
Set-Location ..

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  构建完成！" -ForegroundColor Green
Write-Host ""
Write-Host "  下一步：" -ForegroundColor White
Write-Host "  1. 将整个 project 目录上传到服务器" -ForegroundColor White
Write-Host "  2. 在服务器上执行：" -ForegroundColor White
Write-Host "     cd /path/to/project" -ForegroundColor White
Write-Host "     cp .env.production .env" -ForegroundColor White
Write-Host "     vi .env  # 修改数据库等配置" -ForegroundColor White
Write-Host "     docker compose up -d" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
