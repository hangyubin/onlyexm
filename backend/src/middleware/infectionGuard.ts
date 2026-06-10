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
    const requirement = await prisma.infectionRequirement.findFirst({
      where: {
        userId: user.userId,
        month: currentMonth,
      },
    });

    if (!requirement) {
      const config = await getInfectionConfig();
      await prisma.infectionRequirement.create({
        data: {
          userId: user.userId,
          month: currentMonth,
          requiredCount: config.monthlyRequiredCount,
          completedCount: 0,
        },
      });
      return next();
    }

    const { requiredCount, completedCount, accuracyRate } = requirement;
    const needCount = requiredCount - completedCount;
    const currentAccuracy = accuracyRate ? Number(accuracyRate) : 0;

    const isLocked = needCount > 0 || currentAccuracy < 70;

    if (isLocked && !requirement.isLocked) {
      await prisma.$transaction([
        prisma.infectionRequirement.update({
          where: { id: requirement.id },
          data: { isLocked: true },
        }),
        prisma.user.update({
          where: { id: user.userId },
          data: { isLocked: true },
        }),
      ]);
    }

    if (!isLocked && requirement.isLocked) {
      await prisma.$transaction([
        prisma.infectionRequirement.update({
          where: { id: requirement.id },
          data: { isLocked: false },
        }),
        prisma.user.update({
          where: { id: user.userId },
          data: { isLocked: false },
        }),
      ]);
      return next();
    }

    if (isLocked) {
      return res.status(403).json({
        code: 403,
        message: `院感学习未达标，还需完成 ${needCount > 0 ? needCount : 0} 道题，当前正确率 ${currentAccuracy}%`,
        data: {
          needCount: needCount > 0 ? needCount : 0,
          currentAccuracy,
        },
      });
    }

    next();
  } catch (error) {
    console.error('Infection guard error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
