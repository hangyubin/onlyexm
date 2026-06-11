import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import bcrypt from 'bcryptjs';

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

    const infectionTags = ['HAND_HYGIENE', 'MEDICAL_WASTE', 'DISINFECTION', 'EXPOSURE', 'ISOLATION', 'STERILIZATION', 'MDRO', 'AIR_QUALITY'];
    const tagLabels: Record<string, string> = {
      HAND_HYGIENE: '手卫生',
      MEDICAL_WASTE: '医疗废物',
      DISINFECTION: '消毒隔离',
      EXPOSURE: '职业暴露',
      ISOLATION: '隔离防护',
      STERILIZATION: '无菌操作',
      MDRO: '多重耐药菌',
      AIR_QUALITY: '空气质量',
    };

    // 批量查询所有标签，避免 N+1 查询
    const allRecords = await prisma.practiceSyncRecord.findMany({
      where: {
        userId,
        question: { infectionTag: { in: infectionTags as any[] } },
      },
      include: { question: { select: { infectionTag: true } } },
    });

    // 按标签分组计算正确率
    const tagRecordsMap = new Map<string, typeof allRecords>();
    for (const tag of infectionTags) {
      tagRecordsMap.set(tag, []);
    }
    for (const record of allRecords) {
      const tag = record.question?.infectionTag;
      if (tag && tagRecordsMap.has(tag)) {
        tagRecordsMap.get(tag)!.push(record);
      }
    }

    const radarData = infectionTags.map((tag) => {
      const records = tagRecordsMap.get(tag) || [];
      if (records.length === 0) {
        return { tag, label: tagLabels[tag], value: 0 };
      }
      const correctCount = records.filter(r => r.isCorrect).length;
      const accuracy = Math.round((correctCount / records.length) * 100);
      return { tag, label: tagLabels[tag], value: accuracy };
    });

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
      isPassed: (record.score || 0) >= (record.paper?.passingScore ?? record.paper?.totalScore ? record.paper.totalScore * 0.6 : 60),
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
      // 累加正确数，最后统一计算正确率
      categoryStats[category].accuracy += wq.correctCount;
    });

    // 统一计算各分类的正确率
    for (const cat of Object.keys(categoryStats)) {
      const total = categoryStats[cat].count + categoryStats[cat].accuracy;
      categoryStats[cat].accuracy = total > 0
        ? Math.round((categoryStats[cat].accuracy / total) * 100)
        : 0;
    }

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

router.put('/update', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '用户未登录' });
    }

    const { realName, department, phone, email, password } = req.body;

    const updateData: Record<string, any> = {};

    if (realName !== undefined && String(realName).trim()) {
      updateData.realName = String(realName).trim();
    }
    if (department !== undefined && String(department).trim()) {
      updateData.department = String(department).trim();
    }
    if (phone !== undefined) {
      updateData.phone = String(phone).trim();
    }
    if (email !== undefined) {
      updateData.email = String(email).trim();
    }
    if (password !== undefined && String(password).trim()) {
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.json({ code: 0, message: '没有需要更新的数据' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ code: -1, message: '更新失败' });
  }
});

export default router;