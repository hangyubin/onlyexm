# ============================================================
# 宝塔面板 Docker 部署脚本 (PowerShell)
# 在本地 Windows 环境使用
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  院感培训考试系统 - Docker 部署" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# 检查 .env 文件
if (-not (Test-Path .env)) {
    Write-Host "[!] 未找到 .env 文件，从模板创建..." -ForegroundColor Yellow
    Copy-Item .env.production .env
    Write-Host "[!] 请编辑 .env 文件修改配置后重新运行" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    必须修改: DATABASE_URL, JWT_SECRET, CORS_ORIGIN"
    exit 1
}

# 检查 Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[x] Docker 未安装" -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] 构建镜像..." -ForegroundColor Green
docker compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "[x] 构建失败" -ForegroundColor Red
    exit 1
}

Write-Host "[2/3] 启动容器..." -ForegroundColor Green
docker compose up -d

Write-Host "[3/3] 等待服务就绪..." -ForegroundColor Green
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  管理端: http://localhost:3080/admin/"
Write-Host "  用户端: http://localhost:3080/user/"
Write-Host ""
Write-Host "  常用命令："
Write-Host "  - 查看日志: docker compose logs -f"
Write-Host "  - 重启服务: docker compose restart"
Write-Host "  - 停止服务: docker compose down"
Write-Host "============================================" -ForegroundColor Cyan
