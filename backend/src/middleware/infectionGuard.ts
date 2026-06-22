import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { getInfectionConfig } from '../services/configService';

export async function infectionGuard(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  if (user.role !== 'DOCTOR') {
    return next();
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const config = await getInfectionConfig();
    
    // 使用事务确保读取和写入是原子的，避免 TOCTOU 竞态
    const requirement = await prisma.$transaction(async (tx) => {
      let req = await tx.infectionRequirement.findFirst({
        where: {
          userId: user.userId,
          month: currentMonth,
        },
      });

      if (!req) {
        req = await tx.infectionRequirement.create({
          data: {
            userId: user.userId,
            month: currentMonth,
            requiredCount: config.monthlyRequiredCount,
            completedCount: 0,
          },
        });
        return { requirement: req, isLocked: false };
      }

      const { requiredCount, completedCount, accuracyRate } = req;
      const needCount = requiredCount - completedCount;
      const currentAccuracy = accuracyRate ? Number(accuracyRate) : 0;
      const isLocked = needCount > 0 || currentAccuracy < config.passRateThreshold;

      if (isLocked && !req.isLocked) {
        await tx.infectionRequirement.update({
          where: { id: req.id },
          data: { isLocked: true },
        });
        await tx.user.update({
          where: { id: user.userId },
          data: { isLocked: true },
        });
      } else if (!isLocked && req.isLocked) {
        await tx.infectionRequirement.update({
          where: { id: req.id },
          data: { isLocked: false },
        });
        await tx.user.update({
          where: { id: user.userId },
          data: { isLocked: false },
        });
      }

      return { requirement: req, isLocked, needCount, currentAccuracy };
    });

    if (requirement.isLocked) {
      return res.status(403).json({
        code: 403,
        message: `院感学习未达标，还需完成 ${requirement.needCount > 0 ? requirement.needCount : 0} 道题，当前正确率 ${requirement.currentAccuracy}%`,
        data: {
          needCount: requirement.needCount > 0 ? requirement.needCount : 0,
          currentAccuracy: requirement.currentAccuracy,
        },
      });
    }

    next();
  } catch (error) {
    console.error('Infection guard error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
