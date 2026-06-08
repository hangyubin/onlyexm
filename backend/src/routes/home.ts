import express from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import * as learningMaterialService from '../services/learningMaterialService';

const router = express.Router();

// training 任务完成记录文件（LearningMaterial/LearningRecord 表未 migrate，用 JSON 兜底）
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
  // 同一用户对同一资料只保留一个
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
    const requirement = await prisma.infectionRequirement.findFirst({
      where: {
        userId: user.userId,
        month: currentMonth,
      },
    });

    if (!requirement) {
      return res.json({
        isLocked: false,
        completedCount: 0,
        totalCount: 20,
        correctRate: 0,
        isCompliant: true,
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
  } catch (error) {
    console.error('Get infection status error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/tasks', authMiddleware, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    // 1. 启用中的试卷（= 考试任务）
    const activePapers = await prisma.paper.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. 当前用户对这些试卷的已提交记录（有任意 SUBMITTED 即认为用户「做过」，有 isPassed=true 才算「通过」）
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

    // 每张试卷保留最佳记录（任意一次通过即通过；否则取最高分）
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
    const activeMaterials = learningMaterialService
      .getMaterials({ isActive: true })
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      })
      .slice(0, 3);

    // 4. 当前用户对这些资料的完成记录（JSON 文件存储）
    const completedList = getCompletedRecords();
    const completedMaterialIds = new Set<number>(
      completedList
        .filter((r) => r.userId === user.userId)
        .map((r) => r.materialId),
    );

    // 5. 拼任务列表
    const examTasks = activePapers.map((paper) => {
      const record = recordsByPaper.get(paper.id);
      const status: 'pending' | 'completed' | 'ended' = record?.isPassed ? 'completed' : record ? 'ended' : 'pending';
      return {
        id: paper.id,
        type: 'exam' as const,
        title: paper.name,
        deadline: formatDeadline(paper.createdAt),
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

    // pending 排前，completed 排后
    examTasks.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'pending' ? -1 : 1;
    });
    trainingTasks.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'pending' ? -1 : 1;
    });

    res.json([...examTasks, ...trainingTasks]);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 标记 training 任务完成（前端点击「开始」阅读后调用）
router.post('/tasks/:taskId/complete', authMiddleware, async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: '未授权' });

  try {
    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: '无效的任务 id' });
    }

    const material = learningMaterialService.getMaterialById(taskId);
    if (!material) {
      return res.status(404).json({ error: '学习资料不存在' });
    }

    addCompletedRecord({
      userId: user.userId,
      materialId: taskId,
      title: material.title,
      completedAt: new Date().toISOString(),
    });

    // 同时增加浏览量
    try { learningMaterialService.incrementViewCount(taskId); } catch (_) {}

    res.json({ success: true });
  } catch (error) {
    console.error('complete task error:', error);
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
  } catch (error) {
    console.error('Get wrong count error:', error);
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
      MEDICAL_WASTE: '医废处理',
      EXPOSURE: '职业暴露',
      DISINFECTION: '消毒隔离',
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
  } catch (error) {
    console.error('Get weak points error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
