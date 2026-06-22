import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { getInfectionConfig } from '../services/configService';

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

    // 从每日一练统计题目数和学习时长
    let totalPracticeCount = 0;
    let totalStudyMinutes = 0;
    try {
      const completedPractices = await prisma.dailyPractice.findMany({
        where: { userId, isCompleted: true },
        select: { questions: true },
      });
      for (const p of completedPractices) {
        try {
          const qs = JSON.parse(p.questions as string);
          if (Array.isArray(qs)) {
            totalPracticeCount += qs.length;
            totalStudyMinutes += qs.length; // 1题≈1分钟
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }

    const pendingExams = await prisma.examRecord.findMany({
      where: { userId, status: 'IN_PROGRESS' },
      include: { paper: true },
    });

    let config = null;
    try { config = await getInfectionConfig(); } catch (_) {}

    const stats = {
      user: {
        realName: user?.realName || '',
        department: user?.department || '',
        role: user?.role || '',
        hospitalName: user?.hospital?.name || '',
        phone: (user as any)?.phone || '',
        email: (user as any)?.email || '',
      },
      infectionStatus: {
        isQualified: (infectionRequirement?.completedCount || 0) >= (config?.monthlyRequiredCount || 20) && Number(infectionRequirement?.accuracyRate || 0) >= (config?.passRateThreshold || 70),
        completedCount: infectionRequirement?.completedCount || 0,
        requiredCount: infectionRequirement?.requiredCount || config?.monthlyRequiredCount || 20,
        accuracyRate: Number(infectionRequirement?.accuracyRate || 0),
        remainingCount: Math.max(0, (infectionRequirement?.requiredCount || config?.monthlyRequiredCount || 20) - (infectionRequirement?.completedCount || 0)),
      },
      studyStats: {
        totalStudyHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
        totalPracticeCount: totalPracticeCount,
        monthlyInfectionProgress: {
          completed: infectionRequirement?.completedCount || 0,
          total: infectionRequirement?.requiredCount || config?.monthlyRequiredCount || 20,
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

    // 从每日一练记录统计雷达图数据
    const completedPractices = await prisma.dailyPractice.findMany({
      where: { userId, isCompleted: true },
      select: { questions: true, answers: true },
    });

    const tagStats = new Map<string, { correct: number; total: number }>();
    for (const tag of infectionTags) {
      tagStats.set(tag, { correct: 0, total: 0 });
    }

    for (const practice of completedPractices) {
      try {
        const questions: any[] = JSON.parse(practice.questions as string);
        const answers: Record<string, string | string[]> = JSON.parse(practice.answers as string || '{}');

        for (const q of questions) {
          const tag = q.infectionTag || q.subCategory;
          if (!tag || !tagStats.has(tag)) continue;

          const stats = tagStats.get(tag)!;
          stats.total++;

          const userAnswer = answers[String(q.id)];
          if (!userAnswer) continue;

          const correctOptions = (q.options || []).filter((o: any) => o.isCorrect);
          const correctAnswer = correctOptions.map((o: any) => o.optionKey).sort().join(',');
          const userAnswerStr = Array.isArray(userAnswer) ? userAnswer.sort().join(',') : String(userAnswer);
          if (userAnswerStr === correctAnswer) stats.correct++;
        }
      } catch { /* skip malformed JSON */ }
    }

    const radarData = infectionTags.map((tag) => {
      const stats = tagStats.get(tag) || { correct: 0, total: 0 };
      const value = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      return { tag, label: tagLabels[tag], value };
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
      const trimmed = String(phone).trim();
      updateData.phone = trimmed || null;
    }
    if (email !== undefined) {
      const trimmed = String(email).trim();
      updateData.email = trimmed || null;
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