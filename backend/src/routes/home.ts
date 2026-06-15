import express from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import * as learningMaterialService from '../services/learningMaterialService';
import { getInfectionConfig } from '../services/configService';

const router = express.Router();

// training 任务完成记录文件
const LEARNING_COMPLETED_FILE = path.join(__dirname, '../../data/learningCompletedRecords.json');

interface LearningCompletedRecord {
  userId: number;
  materialId: number;
  title: string;
  completedAt: string;
}

const ensureCompletedFile = () => {
  const dir = path.dirname(LEARNING_COMPLETED_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LEARNING_COMPLETED_FILE)) {
    fs.writeFileSync(LEARNING_COMPLETED_FILE, JSON.stringify([], null, 2));
  }
};

const getCompletedRecords = (): LearningCompletedRecord[] => {
  ensureCompletedFile();
  try {
    return JSON.parse(fs.readFileSync(LEARNING_COMPLETED_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const addCompletedRecord = (record: LearningCompletedRecord) => {
  const list = getCompletedRecords();
  const existing = list.find(r => r.userId === record.userId && r.materialId === record.materialId);
  if (existing) { existing.completedAt = record.completedAt; } else { list.push(record); }
  fs.writeFileSync(LEARNING_COMPLETED_FILE, JSON.stringify(list, null, 2));
};

const formatDeadline = (base?: Date | string | number): string | null => {
  if (!base) return null;
  const baseDate = base instanceof Date ? base : new Date(base);
  if (isNaN(baseDate.getTime())) return null;
  const d = new Date(baseDate.getTime() + 30 * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
};

router.get('/infection-status', authMiddleware, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    let requirement = null;
    try {
      requirement = await prisma.infectionRequirement.findFirst({
        where: { userId: user.userId, month: currentMonth },
      });
    } catch (e: any) {
      console.warn('[infection-status] infectionRequirement 查询失败（可能未 migrate）:', e?.message);
    }

    if (!requirement) {
      let monthlyRequiredCount = 20;
      try {
        const config = await getInfectionConfig();
        monthlyRequiredCount = config.monthlyRequiredCount;
      } catch (_) {}
      
      return res.json({
        isLocked: false,
        completedCount: 0,
        totalCount: monthlyRequiredCount,
        correctRate: 0,
        isCompliant: false,
      });
    }

    const { requiredCount, completedCount, accuracyRate, isLocked } = requirement;
    const currentAccuracy = accuracyRate ? Number(accuracyRate) : 0;
    const isCompliant = completedCount >= requiredCount && currentAccuracy >= 70;

    res.json({
      isLocked,
      completedCount,
      totalCount: requiredCount,
      correctRate: currentAccuracy,
      isCompliant,
    });
  } catch (err) {
    console.error('Get infection status error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/tasks', authMiddleware, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    // 1. 已发布且启用中的试卷（= 考试任务）
    const activePapers = await prisma.paper.findMany({
      where: { isActive: true, isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. 当前用户对这些试卷的已提交记录
    let userRecords: { paperId: number; isPassed: boolean | null; score: number | null }[] = [];
    try {
      userRecords = await prisma.examRecord.findMany({
        where: {
          userId: user.userId,
          paperId: { in: activePapers.map((p) => p.id) },
          status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] },
        },
        select: { paperId: true, isPassed: true, score: true, createdAt: true },
      });
    } catch (err) {
      console.warn('examRecord 查询失败（可能未 migrate），所有 exam 任务按 pending 处理', err);
      userRecords = [];
    }

    // 每张试卷保留最佳记录
    const recordsByPaper = new Map<number, { isPassed: boolean; score: number }>();
    for (const r of userRecords) {
      const existing = recordsByPaper.get(r.paperId);
      const passed = !!r.isPassed;
      const score = r.score ?? 0;
      if (!existing) {
        recordsByPaper.set(r.paperId, { isPassed: passed, score });
      } else if (passed && !existing.isPassed) {
        recordsByPaper.set(r.paperId, { isPassed: passed, score });
      } else if (score > existing.score) {
        recordsByPaper.set(r.paperId, { isPassed: passed || existing.isPassed, score });
      }
    }

    // 3. 启用中的学习资料（取前 3 条）
    const activeMaterials = (await learningMaterialService.getMaterials({ isActive: true }))
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      })
      .slice(0, 3);

    // 4. 当前用户对这些资料的完成记录
    const completedList = getCompletedRecords();
    const completedMaterialIds = new Set<number>(
      completedList
        .filter((r) => r.userId === user.userId)
        .map((r) => r.materialId),
    );

    const now = new Date();

    // 5. 拼任务列表 - 考试任务（使用 examStartTime/examEndTime 判断状态）
    const examTasks = activePapers.map((paper) => {
      const record = recordsByPaper.get(paper.id);

      const startTime = paper.examStartTime ? new Date(paper.examStartTime) : null;
      const endTime = paper.examEndTime
        ? new Date(paper.examEndTime)
        : new Date(new Date(paper.createdAt).getTime() + 30 * 24 * 3600 * 1000);

      const isNotStarted = startTime && now < startTime;
      const isExamEnded = now > endTime;

      let status: 'pending' | 'completed' | 'ended' | 'not_started';
      if (record?.isPassed) {
        // 已通过 = completed
        status = 'completed';
      } else if (record && !record.isPassed) {
        // 已交卷但未通过 = ended（未通过）
        status = 'ended';
      } else if (isNotStarted) {
        // 考试尚未开始 = not_started
        status = 'not_started';
      } else if (isExamEnded) {
        // 考试已结束但用户未参与 = ended
        status = 'ended';
      } else {
        // 考试进行中且用户未交卷 = pending
        status = 'pending';
      }

      return {
        id: paper.id,
        type: 'exam' as const,
        title: paper.name,
        deadline: paper.examEndTime ? new Date(paper.examEndTime).toISOString().slice(0, 10) : formatDeadline(paper.createdAt),
        status,
      };
    });

    const trainingTasks = activeMaterials.map((m) => ({
      id: m.id,
      type: 'training' as const,
      title: m.title,
      deadline: formatDeadline(m.createdAt),
      status: (completedMaterialIds.has(m.id) ? 'completed' : 'pending') as 'pending' | 'completed',
    }));

    const statusOrder: Record<string, number> = { pending: 0, not_started: 1, ended: 2, completed: 3 };
    examTasks.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
    trainingTasks.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'pending' ? -1 : 1;
    });

    res.json([...examTasks, ...trainingTasks]);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/tasks/:taskId/complete', authMiddleware, async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: '未授权' });

  try {
    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: '无效的任务 id' });
    }

    const material = await learningMaterialService.getMaterialById(taskId);
    if (!material) {
      return res.status(404).json({ error: '学习资料不存在' });
    }

    addCompletedRecord({
      userId: user.userId,
      materialId: taskId,
      title: material.title,
      completedAt: new Date().toISOString(),
    });

    try { 
      await learningMaterialService.incrementViewCount(taskId); 
    } catch (_) {}

    res.json({ success: true });
  } catch (err) {
    console.error('complete task error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/wrong-count', authMiddleware, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const count = await prisma.wrongQuestion.count({
      where: {
        userId: user.userId,
        status: 'ACTIVE',
      },
    });

    res.json({ count });
  } catch (err) {
    console.error('Get wrong count error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/weak-points', authMiddleware, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const tagMap: Record<string, string> = {
      HAND_HYGIENE: '手卫生',
      MEDICAL_WASTE: '医疗废物',
      DISINFECTION: '消毒隔离',
      EXPOSURE: '职业暴露',
      ISOLATION: '隔离防护',
      STERILIZATION: '无菌操作',
      MDRO: '多重耐药菌',
      AIR_QUALITY: '空气质量',
    };

    const wrongQuestions = await prisma.wrongQuestion.findMany({
      where: { userId: user.userId, status: 'ACTIVE' },
      include: { question: { select: { infectionTag: true } } },
    });

    const tagStats: Record<string, { total: number; wrong: number }> = {};
    for (const [tag, name] of Object.entries(tagMap)) {
      tagStats[tag] = { total: 0, wrong: 0 };
    }

    for (const wq of wrongQuestions) {
      const tag = wq.question?.infectionTag;
      if (tag && tagStats[tag]) {
        tagStats[tag].total++;
        tagStats[tag].wrong += wq.wrongCount || 1;
      }
    }

    const totalQuestions = await prisma.question.count({
      where: { category: 'INFECTION_KNOWLEDGE' },
    });

    const weakPoints = Object.entries(tagMap).map(([tag, name]) => {
      const stats = tagStats[tag];
      let score = 100;
      if (stats.total > 0 || totalQuestions > 0) {
        const wrongRatio = stats.wrong / Math.max(totalQuestions * 0.15, 1);
        score = Math.max(40, Math.min(100, Math.round(100 - wrongRatio * 60)));
      }
      return { name, score };
    });

    res.json(weakPoints);
  } catch (err) {
    console.error('Get weak points error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/study-stats', authMiddleware, async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: '未授权' });

  try {
    let totalPracticeCount = 0;
    let totalStudyMinutes = 0;
    let monthlyCompleted = 0;
    let monthlyTotal = 20;

    // 统计每日一练的题目数（每道题约1分钟）
    try {
      const completedPractices = await prisma.dailyPractice.findMany({
        where: { userId: user.userId, isCompleted: true },
        select: { questions: true },
      });
      for (const p of completedPractices) {
        try {
          const qs = JSON.parse(p.questions as string);
          if (Array.isArray(qs)) {
            totalPracticeCount += qs.length;
            totalStudyMinutes += qs.length; // 1题 ≈ 1分钟
          }
        } catch { /* JSON parse error, skip */ }
      }
    } catch (e: any) {
      console.warn('[study-stats] dailyPractice 查询失败:', e?.message);
    }

    // 统计考试答题数
    try {
      const examRecords = await prisma.examRecord.findMany({
        where: { userId: user.userId, status: { in: ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'] } },
        select: { paperId: true },
      });
      if (examRecords.length > 0) {
        const paperIds = examRecords.map(r => r.paperId);
        const paperQuestionCounts = await prisma.paperQuestion.groupBy({
          by: ['paperId'],
          where: { paperId: { in: paperIds } },
          _count: { id: true },
        });
        for (const pq of paperQuestionCounts) {
          totalPracticeCount += pq._count.id;
          totalStudyMinutes += pq._count.id * 2; // 每题约2分钟
        }
      }
    } catch (e: any) {
      console.warn('[study-stats] examRecord 查询失败:', e?.message);
    }

    // 月度院感进度
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const infectionRequirement = await prisma.infectionRequirement.findFirst({
        where: { userId: user.userId, month: currentMonth },
      });
      if (infectionRequirement) {
        monthlyCompleted = infectionRequirement.completedCount;
        monthlyTotal = infectionRequirement.requiredCount;
      }
    } catch (e: any) {
      console.warn('[study-stats] infectionRequirement 查询失败:', e?.message);
    }

    res.json({
      totalStudyHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
      totalPracticeCount,
      monthlyInfectionProgress: {
        completed: monthlyCompleted,
        total: monthlyTotal,
      },
    });
  } catch (err) {
    console.error('Get study stats error:', err);
    res.json({
      totalStudyHours: 0,
      totalPracticeCount: 0,
      monthlyInfectionProgress: { completed: 0, total: 20 },
    });
  }
});

export default router;
