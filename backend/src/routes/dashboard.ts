import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalQuestions,
      totalPapers,
      totalExamRecords,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.question.count({ where: { deletedAt: null } }),
      prisma.paper.count(),
      prisma.examRecord.count(),
    ]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const allDoctors = await prisma.user.count({
      where: { role: 'DOCTOR' },
    });
    const qualifiedDoctors = await prisma.infectionRequirement.count({
      where: {
        month: currentMonth,
        isLocked: false,
      },
    });
    const complianceRate = allDoctors > 0 ? Math.round((qualifiedDoctors / allDoctors) * 100) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await prisma.examRecord.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { userId: true },
      distinct: ['userId'],
    });

    res.json({
      totalUsers,
      totalQuestions,
      totalPapers,
      totalExams: totalExamRecords,
      complianceRate,
      activeUsers: activeUsers.length,
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ error: '获取仪表盘统计失败' });
  }
});

router.get('/recent-exams', async (req, res) => {
  try {
    const recentPapers = await prisma.paper.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        examRecords: {
          select: {
            id: true,
            isPassed: true,
            status: true,
          },
        },
      },
    });

    const examData = recentPapers.map((paper) => {
      const participants = paper.examRecords.length;
      const passedCount = paper.examRecords.filter((r) => r.isPassed).length;
      const passRate = participants > 0 ? Math.round((passedCount / participants) * 100) : 0;
      const hasInProgress = paper.examRecords.some((r) => r.status === 'IN_PROGRESS');
      return {
        id: paper.id,
        name: paper.name,
        participants,
        passRate: `${passRate}%`,
        status: hasInProgress ? '进行中' : '已结束',
        deadline: paper.createdAt.toISOString().slice(0, 10),
      };
    });

    res.json(examData);
  } catch (err) {
    console.error('Get recent exams error:', err);
    res.status(500).json({ error: '获取最近考试失败' });
  }
});

router.get('/recent-activities', async (req, res) => {
  try {
    const recentRecords = await prisma.examRecord.findMany({
      where: { status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: { select: { realName: true } },
        paper: { select: { name: true } },
      },
    });

    const activities = recentRecords.map((record) => ({
      user: record.user?.realName || '未知用户',
      action: '完成了',
      target: record.paper?.name || '未知考试',
      time: record.createdAt,
      score: record.score,
    }));

    res.json(activities);
  } catch (err) {
    console.error('Get recent activities error:', err);
    res.status(500).json({ error: '获取最近动态失败' });
  }
});

router.get('/weekly-stats', async (req, res) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    // 一次性获取本周所有考试记录和练习记录，在内存中按天分组
    const [examRecords, practiceRecords] = await Promise.all([
      prisma.examRecord.findMany({
        where: { createdAt: { gte: monday, lt: sunday } },
        select: { userId: true, createdAt: true },
      }),
      prisma.practiceSyncRecord.findMany({
        where: { syncTime: { gte: monday, lt: sunday } },
        select: { syncTime: true },
      }),
    ]);

    // 按天索引构建数据
    const examByDay = new Map<number, { userIds: Set<number>; count: number }>();
    const practiceByDay = new Map<number, number>();

    for (let i = 0; i < 7; i++) {
      examByDay.set(i, { userIds: new Set(), count: 0 });
      practiceByDay.set(i, 0);
    }

    for (const record of examRecords) {
      const dayIndex = Math.floor((record.createdAt.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) {
        const dayData = examByDay.get(dayIndex)!;
        dayData.userIds.add(record.userId);
        dayData.count += 1;
      }
    }

    for (const record of practiceRecords) {
      const dayIndex = Math.floor((record.syncTime.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) {
        practiceByDay.set(dayIndex, practiceByDay.get(dayIndex)! + 1);
      }
    }

    const result = days.map((day, i) => ({
      day,
      learningUsers: examByDay.get(i)!.userIds.size,
      examCount: examByDay.get(i)!.count,
      practiceCount: practiceByDay.get(i)!,
    }));

    res.json(result);
  } catch (err) {
    console.error('Get weekly stats error:', err);
    res.status(500).json({ error: '获取周统计数据失败' });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthStart = new Date(`${currentMonth}-01`);
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const totalUsers = await prisma.user.count({ where: { role: 'DOCTOR' } });

    const usersWithExam = await prisma.examRecord.findMany({
      where: {
        createdAt: { gte: monthStart, lt: nextMonth },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const trainingCompletion = totalUsers > 0 ? Math.round((usersWithExam.length / totalUsers) * 100) : 0;

    const allDoctors = await prisma.user.count({ where: { role: 'DOCTOR' } });
    const qualifiedDoctors = await prisma.infectionRequirement.count({
      where: { month: currentMonth, isLocked: false },
    });
    const complianceProgress = allDoctors > 0 ? Math.round((qualifiedDoctors / allDoctors) * 100) : 0;

    const today = new Date().toISOString().slice(0, 10);
    const todayPractices = await prisma.dailyPractice.count({
      where: { date: today, isCompleted: true },
    });
    const totalTodayPractices = await prisma.dailyPractice.count({
      where: { date: today },
    });
    const dailyPracticeCompletion = totalTodayPractices > 0 ? Math.round((todayPractices / totalTodayPractices) * 100) : 0;

    res.json([
      { label: '本月培训完成', value: trainingCompletion, color: '#1890ff' },
      { label: '院感达标进度', value: complianceProgress, color: '#52c41a' },
      { label: '每日练习完成', value: dailyPracticeCompletion, color: '#722ed1' },
    ]);
  } catch (err) {
    console.error('Get progress error:', err);
    res.status(500).json({ error: '获取进度数据失败' });
  }
});

export default router;
