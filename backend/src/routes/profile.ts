import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未登录' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hospital: true,
      },
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const infectionRequirement = await prisma.infectionRequirement.findFirst({
      where: { userId, month: currentMonth },
    });

    const totalPracticeRecords = await prisma.practiceSyncRecord.count({
      where: { userId },
    });

    const learningRecords = await prisma.learningRecord.findMany({
      where: { userId },
    });
    const totalStudyMinutes = learningRecords.reduce((sum, record) => sum + record.studyDurationSeconds, 0) / 60;

    const examRecords = await prisma.examRecord.findMany({
      where: { userId, status: 'SUBMITTED' },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const pendingExams = await prisma.examRecord.findMany({
      where: { userId, status: 'IN_PROGRESS' },
      include: { paper: true },
    });

    const stats = {
      user: {
        realName: user?.realName || '',
        department: user?.department || '',
        role: user?.role || '',
        hospitalName: user?.hospital?.name || '',
      },
      infectionStatus: {
        isQualified: (infectionRequirement?.completedCount || 0) >= 20 && Number(infectionRequirement?.accuracyRate || 0) >= 70,
        completedCount: infectionRequirement?.completedCount || 0,
        requiredCount: infectionRequirement?.requiredCount || 20,
        accuracyRate: Number(infectionRequirement?.accuracyRate || 0),
        remainingCount: Math.max(0, (infectionRequirement?.requiredCount || 20) - (infectionRequirement?.completedCount || 0)),
      },
      studyStats: {
        totalStudyHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
        totalPracticeCount: totalPracticeRecords,
        monthlyInfectionProgress: {
          completed: infectionRequirement?.completedCount || 0,
          total: infectionRequirement?.requiredCount || 20,
        },
      },
      pendingTasks: {
        pendingExams: pendingExams.map(exam => ({
          id: exam.id,
          paperName: exam.paper?.name || '',
          startTime: exam.startTime,
        })),
        pendingCourses: [],
      },
    };

    res.json({ code: 0, data: stats });
  } catch (err) {
    console.error('Get profile stats error:', err);
    res.status(500).json({ code: -1, message: '获取数据失败' });
  }
});

router.get('/radar-data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未登录' });
    }

    const infectionTags = ['HAND_HYGIENE', 'MEDICAL_WASTE', 'EXPOSURE', 'DISINFECTION', 'MDRO'];
    const tagLabels: Record<string, string> = {
      HAND_HYGIENE: '手卫生',
      MEDICAL_WASTE: '医废处理',
      EXPOSURE: '职业暴露',
      DISINFECTION: '消毒隔离',
      MDRO: '多重耐药菌',
    };

    const radarData = await Promise.all(
      infectionTags.map(async (tag) => {
        const records = await prisma.practiceSyncRecord.findMany({
          where: {
            userId,
            question: { infectionTag: tag as any },
          },
        });

        if (records.length === 0) {
          return { tag, label: tagLabels[tag], value: 0 };
        }

        const correctCount = records.filter(r => r.isCorrect).length;
        const accuracy = Math.round((correctCount / records.length) * 100);
        return { tag, label: tagLabels[tag], value: accuracy };
      })
    );

    res.json({ code: 0, data: radarData });
  } catch (err) {
    console.error('Get radar data error:', err);
    res.status(500).json({ code: -1, message: '获取数据失败' });
  }
});

router.get('/exam-trend', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未登录' });
    }

    const examRecords = await prisma.examRecord.findMany({
      where: { userId, status: 'SUBMITTED' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { paper: true },
    });

    const trendData = examRecords.reverse().map((record, index) => ({
      id: record.id,
      paperName: record.paper?.name || `考试${index + 1}`,
      score: record.score || 0,
      date: record.createdAt.toLocaleDateString('zh-CN'),
      isPassed: (record.score || 0) >= 60,
    }));

    res.json({ code: 0, data: trendData });
  } catch (err) {
    console.error('Get exam trend error:', err);
    res.status(500).json({ code: -1, message: '获取数据失败' });
  }
});

router.get('/wrong-heatmap', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未登录' });
    }

    const wrongQuestions = await prisma.wrongQuestion.findMany({
      where: { userId },
      include: { question: true },
    });

    const categoryStats: Record<string, { count: number; accuracy: number }> = {};
    const categoryLabels: Record<string, string> = {
      BASIC_THEORY: '基础理论',
      BASIC_KNOWLEDGE: '基础知识',
      BASIC_SKILL: '基本技能',
    };

    wrongQuestions.forEach(wq => {
      const category = wq.question.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, accuracy: 0 };
      }
      categoryStats[category].count += wq.wrongCount;
      const total = wq.wrongCount + wq.correctCount;
      categoryStats[category].accuracy = total > 0 
        ? Math.round((wq.correctCount / total) * 100) 
        : 0;
    });

    const heatmapData = Object.entries(categoryStats).map(([key, value]) => ({
      category: key,
      label: categoryLabels[key] || key,
      wrongCount: value.count,
      accuracy: value.accuracy,
      intensity: Math.min(value.count / 10, 1),
    }));

    res.json({ code: 0, data: heatmapData });
  } catch (err) {
    console.error('Get wrong heatmap error:', err);
    res.status(500).json({ code: -1, message: '获取数据失败' });
  }
});

export default router;