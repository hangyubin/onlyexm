import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: '无效的 token' });
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: '认证失败' });
  }
}
