# 院感培训系统部署指南

## 项目结构

```
project/
├── backend/              # 后端服务 (Node.js + Express + TypeScript)
├── frontend-user/        # 用户端H5应用 (React + Vite)
├── frontend-admin-pc/    # 管理端PC应用 (React + Ant Design)
├── frontend-admin/       # 移动端管理应用 (可选)
├── docker-compose.yml    # Docker编排配置
└── .env.example          # 环境变量示例
```

## 环境要求

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0
- **npm** 或 **yarn**
- **Docker** (可选，用于容器化部署)

## 一、开发环境部署

### 1.1 准备工作

```bash
# 克隆项目
git clone <repository-url>
cd project

# 复制环境变量文件
cp .env.example .env
```

### 1.2 配置环境变量

编辑 `.env` 文件：

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

DATABASE_URL="mysql://root:root_password@localhost:3306/project_db"

MYSQL_ROOT_PASSWORD=root_password
MYSQL_DATABASE=project_db
MYSQL_USER=project_user
MYSQL_PASSWORD=project_password

REDIS_URL=redis://localhost:6379

JWT_SECRET=your_jwt_secret_key_here
```

### 1.3 启动数据库和Redis

#### 方式一：使用 Docker

```bash
# 启动MySQL和Redis容器
docker-compose up -d

# 查看容器状态
docker-compose ps
```

#### 方式二：本地安装

确保本地已安装并启动：
- MySQL 8.0+
- Redis 6.0+

### 1.4 后端部署

```bash
cd backend

# 安装依赖
npm install

# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 启动开发服务器
npm run dev
```

后端服务将在 `http://localhost:3000` 运行。

### 1.5 用户端H5应用部署

```bash
cd frontend-user

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

用户端将在 `http://localhost:5174` 运行。

### 1.6 管理端PC应用部署

```bash
cd frontend-admin-pc

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

管理端将在 `http://localhost:5173` 运行。

## 二、生产环境部署

### 2.1 构建应用

```bash
# 后端构建
cd backend
npm install --production
npm run build

# 用户端构建
cd ../frontend-user
npm install --production
npm run build

# 管理端构建
cd ../frontend-admin-pc
npm install --production
npm run build
```

### 2.2 Nginx配置

创建 Nginx 配置文件 `/etc/nginx/sites-available/project`：

```nginx
# 后端API服务
upstream backend_api {
    server 127.0.0.1:3000;
}

# 用户端H5应用
upstream frontend_user {
    server 127.0.0.1:5174;
}

# 管理端PC应用
upstream frontend_admin {
    server 127.0.0.1:5173;
}

server {
    listen 80;
    server_name your-domain.com;

    # 用户端H5应用
    location / {
        proxy_pass http://frontend_user;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 管理端
    location /admin {
        alias /path/to/frontend-admin-pc/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # 后端API
    location /api {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket支持（如果需要）
    location /socket.io {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 2.3 使用PM2管理后端服务

```bash
# 全局安装PM2
npm install -g pm2

# 启动后端服务
cd backend
pm2 start dist/index.js --name project-backend

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

## 三、Docker容器化部署（推荐）

### 3.1 创建后端Dockerfile

在 `backend/` 目录下创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 3.2 创建前端Dockerfile

在 `frontend-user/` 目录下创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

创建 `frontend-user/nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3.3 更新docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: project-mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - project-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: project-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - project-network
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: project-backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    depends_on:
      - mysql
      - redis
    networks:
      - project-network
    restart: unless-stopped
    command: >
      sh -c "
      npx prisma generate &&
      npx prisma migrate deploy &&
      node dist/index.js
      "

  frontend-user:
    build: ./frontend-user
    container_name: project-frontend-user
    ports:
      - "5174:80"
    depends_on:
      - backend
    networks:
      - project-network
    restart: unless-stopped

  frontend-admin:
    build: ./frontend-admin-pc
    container_name: project-frontend-admin
    ports:
      - "5173:80"
    depends_on:
      - backend
    networks:
      - project-network
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:

networks:
  project-network:
    driver: bridge
```

### 3.4 启动Docker容器

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 停止所有服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

## 四、数据库初始化

### 4.1 运行迁移

```bash
cd backend

# 开发环境
npm run prisma:migrate

# 生产环境
npx prisma migrate deploy
```

### 4.2 初始化数据（可选）

创建种子数据文件 `backend/prisma/seed.ts`：

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建默认管理员
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      role: 'ADMIN',
      department: '院感科',
      hospitalId: 1,
    },
  });

  console.log('Admin created:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

运行种子数据：

```bash
cd backend
npx ts-node prisma/seed.ts
```

## 五、验证部署

### 5.1 检查服务状态

```bash
# 后端健康检查
curl http://localhost:3000/api/health

# 检查MySQL连接
docker-compose logs mysql

# 检查Redis连接
docker-compose logs redis
```

### 5.2 访问应用

- 用户端H5应用：`http://localhost:5174`
- 管理端PC应用：`http://localhost:5173`
- 后端API：`http://localhost:3000/api`

### 5.3 默认登录账号

- 用户名：`admin`
- 密码：`admin123`

## 六、常见问题排查

### 6.1 数据库连接失败

```bash
# 检查MySQL容器是否运行
docker-compose ps mysql

# 查看MySQL日志
docker-compose logs mysql

# 进入MySQL容器
docker exec -it project-mysql mysql -u root -p
```

### 6.2 Prisma迁移失败

```bash
# 重置数据库
cd backend
npx prisma migrate reset

# 重新生成客户端
npx prisma generate
```

### 6.3 前端无法连接后端

检查环境变量 `CORS_ORIGIN` 配置是否包含前端地址。

## 七、安全建议

1. **修改默认密码**：生产环境务必修改所有默认密码
2. **使用HTTPS**：配置SSL证书
3. **环境变量**：不要在代码中硬编码敏感信息
4. **JWT密钥**：使用足够复杂的随机字符串
5. **定期更新**：保持依赖包最新版本
6. **日志监控**：配置日志收集和告警

## 八、性能优化

1. **Redis缓存**：启用Redis缓存热点数据
2. **数据库索引**：确保关键字段有索引
3. **前端构建**：使用生产模式构建
4. **Nginx缓存**：配置静态资源缓存
5. **PM2集群**：使用PM2启动多个实例

## 九、监控和日志

### 9.1 PM2监控

```bash
# 查看实时日志
pm2 logs project-backend

# 查看进程状态
pm2 monit

# 查看所有进程
pm2 list
```

### 9.2 Docker监控

```bash
# 查看资源使用
docker stats

# 查看所有日志
docker-compose logs -f
```

## 十、备份和恢复

### 10.1 数据库备份

```bash
# 创建备份
docker exec project-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} project_db > backup.sql

# 恢复数据
docker exec -i project-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} project_db < backup.sql
```

### 10.2 Redis备份

Redis数据会自动持久化到 `redis_data` 卷。

## 技术支持

如有问题，请检查：
1. 所有服务日志
2. 数据库连接配置
3. 环境变量设置
4. 端口占用情况

祝部署顺利！
