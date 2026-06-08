/// <reference path="./types/express.d.ts" />
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import infectionRoutes from './routes/infection';
import questionRoutes from './routes/question';
import paperRoutes from './routes/paper';
import examRoutes from './routes/exam';
import wrongQuestionRoutes from './routes/wrongQuestion';
import dailyPracticeRoutes from './routes/dailyPractice';
import syncRoutes from './routes/sync';
import profileRoutes from './routes/profile';
import reportRoutes from './routes/reports';
import configRoutes from './routes/config';
import homeRoutes from './routes/home';
import userRoutes from './routes/user';
import hospitalRoutes from './routes/hospital';
import learningMaterialRoutes from './routes/learningMaterial';
import dashboardRoutes from './routes/dashboard';
import systemRoutes from './routes/system';

// 优先从项目根目录加载 .env，回退到 backend/.env
const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const sanitizeFilename = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.mp4', '.webm', '.ogg', '.mov', '.mp3', '.wav', '.txt'
  ];
  if (allowedExts.includes(ext)) {
    return ext;
  }
  return '.bin';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const ext = sanitizeFilename(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-wav',
      'text/plain'
    ];
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf',
      '.doc', '.docx',
      '.xls', '.xlsx',
      '.ppt', '.pptx',
      '.mp4', '.webm', '.ogg', '.mov',
      '.mp3', '.wav',
      '.txt'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('文件类型不支持'));
    }
  }
});

// 正确处理多个 CORS origin
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
  },
}));

// 前端静态文件服务（Docker 环境由 Nginx 处理，此处仅开发环境使用）
const adminDistDir = fs.existsSync(path.join(__dirname, '..', '..', 'frontend', 'admin'))
  ? path.join(__dirname, '..', '..', 'frontend', 'admin')  // Docker 容器内路径
  : path.join(__dirname, '..', '..', 'frontend-admin-pc', 'dist');  // 本地开发路径
const userDistDir = fs.existsSync(path.join(__dirname, '..', '..', 'frontend', 'user'))
  ? path.join(__dirname, '..', '..', 'frontend', 'user')  // Docker 容器内路径
  : path.join(__dirname, '..', '..', 'frontend-user', 'dist');  // 本地开发路径

app.use('/admin', express.static(adminDistDir));
app.use('/user', express.static(userDistDir));

// 根路径重定向到用户端
app.get('/', (req, res) => {
  res.redirect('/user');
});

// 管理端 SPA fallback
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminDistDir, 'index.html'));
});

// 用户端 SPA fallback
app.get('/user/*', (req, res) => {
  res.sendFile(path.join(userDistDir, 'index.html'));
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 处理浏览器自动请求 favicon.ico（避免 404 错误）
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.use('/api/auth', authRoutes);
app.use('/api/infection', infectionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/wrong-questions', wrongQuestionRoutes);
app.use('/api/daily-practice', dailyPracticeRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/user/profile', profileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system/config', configRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/learning-materials', learningMaterialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/system', systemRoutes);
app.post('/api/upload', authMiddleware, (req, res) => {
  const uploadHandler = upload.single('file');
  uploadHandler(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || '上传失败' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择文件' });
    }
    res.json({
      success: true,
      data: {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.originalname
      }
    });
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    await require('./services/learningMaterialService').initSampleData();
    console.log('Learning material sample data initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

startServer();

