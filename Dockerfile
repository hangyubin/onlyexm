# ============================================================
# 单镜像：前端(管理端+用户端) + 后端 API + Nginx
# 多阶段构建，在 GitHub Actions 上编译，服务器只需拉取镜像
# ============================================================

# ---------- 阶段1: 构建管理端 ----------
FROM node:20-alpine AS admin-builder

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY frontend-admin-pc/.npmrc ./
COPY frontend-admin-pc/package*.json ./
RUN npm ci --registry=https://registry.npmmirror.com

COPY frontend-admin-pc/ ./
RUN npm run build

# ---------- 阶段2: 构建用户端 ----------
FROM node:20-alpine AS user-builder

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY frontend-user/.npmrc ./
COPY frontend-user/package*.json ./
RUN npm ci --registry=https://registry.npmmirror.com

COPY frontend-user/ ./
RUN npm run build

# ---------- 阶段3: 构建后端 ----------
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY backend/.npmrc ./
COPY backend/package*.json ./
RUN npm ci --registry=https://registry.npmmirror.com

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/
RUN npm run build

# ---------- 阶段4: 运行时镜像 ----------
FROM node:20-alpine

RUN apk add --no-cache nginx supervisor wget

# 下载中文字体用于 PDF 生成（PDFKit 不支持 .ttc，需用 .otf）
RUN wget -q "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf" \
  -O /usr/share/fonts/NotoSansSC-Regular.otf \
  && fc-cache -fv || true

# 复制后端运行时文件
COPY --from=backend-builder /app/dist /app/backend/dist
COPY --from=backend-builder /app/node_modules /app/backend/node_modules
COPY --from=backend-builder /app/prisma /app/backend/prisma
COPY --from=backend-builder /app/package.json /app/backend/

# 复制中文字体文件（PDF 生成用）
COPY backend/fonts /app/backend/fonts

# 复制前端构建产物
COPY --from=admin-builder /app/dist /app/frontend/admin
COPY --from=user-builder /app/dist /app/frontend/user

# Nginx 配置
COPY deploy/nginx.conf /etc/nginx/http.d/default.conf
RUN mkdir -p /run/nginx && rm -f /etc/nginx/http.d/default.conf.bak

# Supervisor 配置
COPY deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 启动脚本
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 创建 uploads 目录
RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
