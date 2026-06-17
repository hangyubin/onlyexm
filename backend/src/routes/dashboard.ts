import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = express.Router();

router.use(authMiddleware);
router.use(roleGuard(['ADMIN', 'INFECTION_OFFICER']));

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
        completedCount: { gte: 20 },
        accuracyRate: { gte: 70 },
      },
    });
    const complianceRate = allDoctors > 0 ? Math.round((qualifiedDoctors / allDoctors) * 100) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [activeExamUsers, activePracticeUsers, activeLearningUsers] = await Promise.all([
      prisma.examRecord.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.dailyPractice.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.learningRecord.findMany({
        where: { completedAt: { gte: thirtyDaysAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);
    const activeUserIds = new Set<number>();
    activeExamUsers.forEach(r => activeUserIds.add(r.userId));
    activePracticeUsers.forEach(r => activeUserIds.add(r.userId));
    activeLearningUsers.forEach(r => activeUserIds.add(r.userId));

    res.json({
      totalUsers,
      totalQuestions,
      totalPapers,
      totalExams: totalExamRecords,
      complianceRate,
      activeUsers: activeUserIds.size,
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ error: '获取仪表盘统计失败' });
  }
});

router.get('/recent-exams', async (req, res) => {
  try {
    const recentPapers = await prisma.paper.findMany({
      where: { isPublished: true },
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

    const now = new Date();

    const examData = recentPapers.map((paper) => {
      const participants = paper.examRecords.length;
      const passedCount = paper.examRecords.filter((r) => r.isPassed).length;
      const passRate = participants > 0 ? Math.round((passedCount / participants) * 100) : 0;
      const hasInProgress = paper.examRecords.some((r) => r.status === 'IN_PROGRESS');

      // 基于 examStartTime/examEndTime 判断考试状态
      let status: string;
      if (hasInProgress) {
        status = '进行中';
      } else if (paper.examStartTime && now < new Date(paper.examStartTime)) {
        status = '未开始';
      } else if (paper.examEndTime && now > new Date(paper.examEndTime)) {
        status = '已结束';
      } else if (paper.examStartTime && paper.examEndTime) {
        // 在考试时间范围内但无人答题
        status = '进行中';
      } else {
        // 未设置考试时间，按有无交卷记录判断
        const hasSubmitted = paper.examRecords.some((r) =>
          ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'].includes(r.status)
        );
        status = hasSubmitted ? '已结束' : '进行中';
      }

      return {
        id: paper.id,
        name: paper.name,
        participants,
        passRate: `${passRate}%`,
        status,
        deadline: paper.examEndTime
          ? new Date(paper.examEndTime).toISOString().slice(0, 10)
          : paper.createdAt.toISOString().slice(0, 10),
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
    // 并行获取多种类型的动态
    const [examRecords, practiceRecords, learningRecords] = await Promise.all([
      // 考试交卷动态
      prisma.examRecord.findMany({
        where: { status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { realName: true } },
          paper: { select: { name: true } },
        },
      }),
      // 每日一练完成动态
      prisma.dailyPractice.findMany({
        where: { isCompleted: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { realName: true } },
        },
      }),
      // 学习资料浏览动态
      prisma.learningRecord.findMany({
        orderBy: { completedAt: 'desc' },
        take: 8,
        include: {
          user: { select: { realName: true } },
        },
      }),
    ]);

    const activities: any[] = [];

    for (const record of examRecords) {
      activities.push({
        user: record.user?.realName || '未知用户',
        action: '完成了考试',
        target: record.paper?.name || '未知考试',
        time: record.createdAt,
        score: record.score,
        type: 'exam',
      });
    }

    for (const record of practiceRecords) {
      activities.push({
        user: record.user?.realName || '未知用户',
        action: '完成了每日一练',
        target: record.date,
        time: record.createdAt,
        score: record.score,
        type: 'practice',
      });
    }

    for (const record of learningRecords) {
      activities.push({
        user: record.user?.realName || '未知用户',
        action: '学习了资料',
        target: record.contentTitle || '未知资料',
        time: record.completedAt,
        score: null,
        type: 'learning',
      });
    }

    // 按时间倒序排列，取最新8条
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    res.json(activities.slice(0, 8));
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

    // 并行获取本周所有记录
    const [examRecords, practiceSyncRecords, dailyPractices, learningRecords] = await Promise.all([
      prisma.examRecord.findMany({
        where: { createdAt: { gte: monday, lt: sunday } },
        select: { userId: true, createdAt: true },
      }),
      prisma.practiceSyncRecord.findMany({
        where: { syncTime: { gte: monday, lt: sunday } },
        select: { syncTime: true },
      }),
      prisma.dailyPractice.findMany({
        where: { isCompleted: true, createdAt: { gte: monday, lt: sunday } },
        select: { userId: true, createdAt: true },
      }),
      prisma.learningRecord.findMany({
        where: { completedAt: { gte: monday, lt: sunday } },
        select: { userId: true, completedAt: true },
      }),
    ]);

    // 按天索引构建数据
    const examByDay = new Map<number, { userIds: Set<number>; count: number }>();
    const practiceByDay = new Map<number, number>();
    const learningByDay = new Map<number, { userIds: Set<number>; count: number }>();

    for (let i = 0; i < 7; i++) {
      examByDay.set(i, { userIds: new Set(), count: 0 });
      practiceByDay.set(i, 0);
      learningByDay.set(i, { userIds: new Set(), count: 0 });
    }

    for (const record of examRecords) {
      const dayIndex = Math.floor((record.createdAt.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) {
        const dayData = examByDay.get(dayIndex)!;
        dayData.userIds.add(record.userId);
        dayData.count += 1;
      }
    }

    for (const record of practiceSyncRecords) {
      const dayIndex = Math.floor((record.syncTime.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) {
        practiceByDay.set(dayIndex, practiceByDay.get(dayIndex)! + 1);
      }
    }

    for (const record of dailyPractices) {
      const dayIndex = Math.floor((record.createdAt.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) {
        practiceByDay.set(dayIndex, practiceByDay.get(dayIndex)! + 1);
      }
    }

    for (const record of learningRecords) {
      const dayIndex = Math.floor((record.completedAt.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) {
        const dayData = learningByDay.get(dayIndex)!;
        dayData.userIds.add(record.userId);
        dayData.count += 1;
      }
    }

    const result = days.map((day, i) => {
      // 学习人数 = 考试人数 + 每日一练人数 + 学习资料人数（去重）
      const allUserIds = new Set<number>();
      examByDay.get(i)!.userIds.forEach(id => allUserIds.add(id));
      dailyPractices.filter(r => {
        const dayIndex = Math.floor((r.createdAt.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
        return dayIndex === i;
      }).forEach(r => allUserIds.add(r.userId));
      learningByDay.get(i)!.userIds.forEach(id => allUserIds.add(id));

      return {
        day,
        learningUsers: allUserIds.size,
        examCount: examByDay.get(i)!.count,
        practiceCount: practiceByDay.get(i)!,
      };
    });

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
      where: {
        month: currentMonth,
        completedCount: { gte: 20 },
        accuracyRate: { gte: 70 },
      },
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
