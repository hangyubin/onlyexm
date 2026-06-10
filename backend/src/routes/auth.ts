import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { signToken } from '../utils/jwt';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getInfectionConfig } from '../services/configService';
import { success, error } from '../utils/response';

const router = express.Router();

// 登录频率限制
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15分钟

function checkLoginLimit(ip: string): string | null {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return null;
  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    const remainingMinutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    return `登录尝试过多，请${remainingMinutes}分钟后再试`;
  }
  if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
    loginAttempts.delete(ip);
  }
  return null;
}

function recordLoginFailure(ip: string) {
  const attempt = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  attempt.count++;
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCK_DURATION;
  }
  loginAttempts.set(ip, attempt);
}

function clearLoginFailure(ip: string) {
  loginAttempts.delete(ip);
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress || 'unknown';
    const limitMsg = checkLoginLimit(clientIp);
    if (limitMsg) {
      return error(res, 429, limitMsg);
    }

    if (!username || !password) {
      return error(res, 400, '用户名和密码不能为空');
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      // 记录失败尝试，防止用户名枚举攻击
      recordLoginFailure(clientIp);
      return error(res, 401, '用户名或密码错误');
    }

    if (user.isLocked) {
      return error(res, 403, '院感未达标，已被锁定');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      recordLoginFailure(clientIp);
      return error(res, 401, '用户名或密码错误');
    }

    clearLoginFailure(clientIp);
    const token = signToken({
      userId: user.id,
      role: user.role,
      department: user.department,
    });

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role,
        department: user.department,
        hospitalId: user.hospitalId,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    error(res, 500, '服务器内部错误');
  }
});

router.post('/register', authMiddleware, roleGuard(['ADMIN']), async (req, res) => {
  try {
    const { username, password, realName, role, department, hospitalId } = req.body;

    if (!username || !password || !realName || !role || !department) {
      return error(res, 400, '缺少必填字段');
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return error(res, 409, '用户名已存在');
    }

    if (hospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
      });
      if (!hospital) {
        return error(res, 400, '医院不存在');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const currentMonth = new Date().toISOString().slice(0, 7);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        role,
        department,
        hospitalId: hospitalId || null,
      },
    });

    const config = await getInfectionConfig();
    const infectionRequirement = await prisma.infectionRequirement.create({
      data: {
        userId: user.id,
        month: currentMonth,
        requiredCount: config.monthlyRequiredCount,
        completedCount: 0,
      },
    });

    success(res, {
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role,
        department: user.department,
        hospitalId: user.hospitalId,
      },
      infectionRequirement,
    });
  } catch (err) {
    console.error('Register error:', err);
    error(res, 500, '服务器内部错误');
  }
});

// 用户修改密码
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return error(res, 400, '旧密码和新密码不能为空');
    }

    if (newPassword.length < 6) {
      return error(res, 400, '新密码长度不能少于6位');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return error(res, 404, '用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return error(res, 400, '旧密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    success(res, null, '密码修改成功');
  } catch (err) {
    console.error('Change password error:', err);
    error(res, 500, '密码修改失败');
  }
});

export default router;
